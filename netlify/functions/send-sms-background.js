const C = require('./lib/core');
const job = require('./lib/job');

const now = () => new Date().toISOString();

async function updateTotals(messageId) {
  const rows = await C.table('message_recipients', `message_id=eq.${messageId}&select=status,twilio_sid&limit=500`);
  await C.table('messages', `id=eq.${messageId}`, {method:'PATCH', body:{
    twilio_message_count:rows.filter(r => r.twilio_sid || ['failed','undelivered','unknown'].includes(r.status)).length,
    successful_count:rows.filter(r => ['queued','sent','delivered'].includes(r.status) && r.twilio_sid).length,
    failed_count:rows.filter(r => ['failed','undelivered','unknown'].includes(r.status)).length
  }});
}

async function processRecipient(row, message) {
  const claim = await C.table('message_recipients', `id=eq.${row.id}&status=eq.queued&twilio_sid=is.null`, {
    method:'PATCH', body:{status:'sending', updated_at:now()}, prefer:'return=representation'
  });
  if (!claim?.length) return;
  let result;
  try {
    const member = (await C.table('members', `id=eq.${row.member_id}&select=active,sms_opt_in,phone&limit=1`))[0];
    if (!member?.active || !member.sms_opt_in || C.phone(member.phone) !== row.phone) {
      await C.table('message_recipients', `id=eq.${row.id}&status=eq.sending`, {
        method:'PATCH', body:{status:'skipped', updated_at:now()}
      });
      return;
    }
    const callback = `${C.env('SITE_URL').replace(/\/$/, '')}/.netlify/functions/twilio-status?recipient_id=${row.id}`;
    result = await C.twilioSend(row.phone, message.body, callback);
  } catch (error) {
    result = {ok:false, ambiguous:true, error_code:'unknown', error_message:'Delivery request outcome unknown. Check Twilio before retrying.'};
  }
  const status = result.ok ? result.status : result.ambiguous ? 'unknown' : 'failed';
  await C.table('message_recipients', `id=eq.${row.id}&status=eq.sending`, {
    method:'PATCH', body:{status, twilio_sid:result.sid || null, error_code:result.error_code || null,
      error_message:result.error_message || null, updated_at:now()}
  });
  if (result.error_code === '21610') {
    await C.table('members', `id=eq.${row.member_id}`, {method:'PATCH', body:{
      sms_opt_in:false, sms_opt_out_date:now(), updated_at:now()
    }});
  }
}

exports.handler = async event => {
  if (event.httpMethod !== 'POST') return {statusCode:405};
  let data;
  try { data = C.parse(event); } catch { return {statusCode:400}; }
  if (!job.valid(data.message_id, data.signature)) return {statusCode:403};
  const message = (await C.table('messages', `id=eq.${data.message_id}&select=id,body&limit=1`))[0];
  if (!message) return {statusCode:404};
  const rows = await C.table('message_recipients',
    `message_id=eq.${message.id}&status=eq.queued&twilio_sid=is.null&select=id,member_id,phone&limit=101`);
  let cursor = 0;
  async function worker() {
    while (cursor < rows.length) {
      const row = rows[cursor++];
      try { await processRecipient(row, message); }
      catch (error) { console.error('Recipient processing failed', row.id, error.message); }
    }
  }
  await Promise.all(Array.from({length:Math.min(5, rows.length)}, worker));
  await updateTotals(message.id);
  return {statusCode:204};
};
