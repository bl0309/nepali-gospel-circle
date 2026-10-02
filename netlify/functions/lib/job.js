const {createHmac, timingSafeEqual} = require('node:crypto');
const C = require('./core');
const signature = id => createHmac('sha256', C.env('SUPABASE_SERVICE_ROLE_KEY')).update(`ngc-send:${id}`).digest('hex');
const valid = (id, supplied) => {
  if (!C.uuid(id) || typeof supplied !== 'string' || !/^[0-9a-f]{64}$/i.test(supplied)) return false;
  return timingSafeEqual(Buffer.from(signature(id), 'hex'), Buffer.from(supplied, 'hex'));
};
async function invoke(id) {
  const url = `${C.env('SITE_URL').replace(/\/$/, '')}/.netlify/functions/send-sms-background`;
  const response = await fetch(url, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({message_id:id, signature:signature(id)}), signal:AbortSignal.timeout(6000)
  });
  return response.status === 202;
}
module.exports = {signature, valid, invoke};
