const C = require('./lib/core');
const {createHmac, randomInt, randomUUID, timingSafeEqual} = require('node:crypto');

const hash = value => createHmac('sha256', C.env('SUPABASE_SERVICE_ROLE_KEY')).update(value).digest('hex');
const codeHash = (id, code) => hash(`signup-code:${id}:${code}`);
const equalHash = (a, b) => {
  const left = Buffer.from(a || '', 'hex'), right = Buffer.from(b || '', 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
};

async function requestCode(event, data) {
  if (data.website) return C.json(200, {request_id:randomUUID()});
  const first_name = String(data.first_name || '').trim();
  const last_name = String(data.last_name || '').trim();
  const email = String(data.email || '').trim();
  if (data.consent !== true || !first_name || first_name.length > 100 || last_name.length > 100 ||
      email.length > 255 || !(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    return C.fail(400, 'Check the form and consent box.');
  }
  const phone = C.phone(data.phone);
  const existing = (await C.table('members', `phone=eq.${encodeURIComponent(phone)}&select=id,active,sms_opt_out_date&limit=1`))[0];
  if (existing?.sms_opt_out_date) return C.fail(400, 'This number opted out. Text START to the church number before signing up.');
  if (existing && !existing.active) return C.fail(400, 'Please contact church leadership to update this number.');
  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  const ipHash = hash(`signup-ip:${ip}`), phoneHash = hash(`signup-phone:${phone}`);
  const allowed = await C.supa('/rest/v1/rpc/claim_signup_attempt', {method:'POST',
    body:{p_ip_hash:ipHash, p_phone_hash:phoneHash}});
  if (!allowed) return C.fail(429, 'Too many requests. Please try later.');
  const id = randomUUID(), code = String(randomInt(0, 1000000)).padStart(6, '0');
  await C.table('signup_requests', `phone=eq.${encodeURIComponent(phone)}`, {method:'DELETE'});
  await C.table('signup_requests', '', {method:'POST', body:{
    id, phone, first_name, last_name, email:email || null, code_hash:codeHash(id, code),
    expires_at:new Date(Date.now() + 10 * 60000).toISOString()
  }});
  try {
    const result = await C.twilioSend(phone, `Nepali Gospel Circle: Your signup code is ${code}. It expires in 10 minutes. If you did not request this, ignore it.`);
    if (!result.ok) throw new Error('Verification SMS was rejected.');
  } catch (error) {
    await C.table('signup_requests', `id=eq.${id}`, {method:'DELETE'});
    if (error.status === 503) throw error;
    return C.fail(502, 'Could not send the verification code. Please try again later.');
  }
  await Promise.allSettled([
    C.table('signup_requests', `expires_at=lt.${encodeURIComponent(new Date().toISOString())}`, {method:'DELETE'}),
    C.table('signup_attempts', `created_at=lt.${encodeURIComponent(new Date(Date.now() - 30 * 86400000).toISOString())}`, {method:'DELETE'})
  ]);
  return C.json(200, {request_id:id});
}

async function confirm(data) {
  if (!C.uuid(data.request_id) || !/^\d{6}$/.test(data.code || '')) return C.fail(400, 'Enter the six-digit code.');
  const request = (await C.table('signup_requests', `id=eq.${data.request_id}&select=id,phone,first_name,last_name,email,code_hash,attempts,expires_at&limit=1`))[0];
  if (!request || new Date(request.expires_at).getTime() < Date.now()) return C.fail(400, 'This code expired. Request a new code.');
  if (request.attempts >= 5) return C.fail(429, 'Too many incorrect codes. Request a new code later.');
  const claimed = await C.table('signup_requests', `id=eq.${request.id}&attempts=eq.${request.attempts}`, {method:'PATCH', body:{attempts:request.attempts + 1}, prefer:'return=representation'});
  if (!claimed?.length) return C.fail(409, 'Please try the code again.');
  if (!equalHash(codeHash(request.id, data.code), request.code_hash)) return C.fail(400, 'Incorrect code. Please try again.');
  const existing = (await C.table('members', `phone=eq.${encodeURIComponent(request.phone)}&select=id,active,sms_opt_out_date&limit=1`))[0];
  if (existing?.sms_opt_out_date || existing && !existing.active) return C.fail(400, 'Please contact church leadership about this number.');
  const now = new Date().toISOString();
  if (existing) {
    await C.table('members', `id=eq.${existing.id}`, {method:'PATCH', body:{sms_opt_in:true, sms_opt_in_date:now, sms_consent_source:'public_verified', updated_at:now}});
  } else {
    await C.table('members', '', {method:'POST', body:{
      first_name:request.first_name, last_name:request.last_name, phone:request.phone,
      email:request.email, active:true, sms_opt_in:true, sms_opt_in_date:now, sms_consent_source:'public_verified'
    }});
  }
  await C.table('signup_requests', `id=eq.${request.id}`, {method:'DELETE'}).catch(() => {});
  return C.json(200, {ok:true});
}

exports.handler = async event => {
  try {
    if (!C.method(event, ['POST'])) return C.fail(405, 'Method not allowed.');
    const data = C.parse(event);
    if (data.action === 'confirm') return confirm(data);
    if (data.action === 'request') return requestCode(event, data);
    return C.fail(400, 'Invalid signup action.');
  } catch (error) { return C.handle(error); }
};
module.exports.codeHash = codeHash;
