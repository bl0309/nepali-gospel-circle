const C = require('./lib/core');

exports.handler = async event => {
  try {
    if (event.httpMethod !== 'POST' || !C.twilioValid(event)) return C.fail(403, 'Forbidden.');
    const data = new URLSearchParams(C.formBody(event));
    const sid = data.get('MessageSid');
    let status = data.get('MessageStatus');
    if (!/^SM[a-f0-9]{32}$/i.test(sid || '')) return C.fail(400, 'Invalid message.');
    if (['accepted', 'sending'].includes(status)) status = 'queued';
    if (!['queued', 'sent', 'delivered', 'undelivered', 'failed'].includes(status)) {
      return C.fail(400, 'Invalid status.');
    }
    const recipientId = event.queryStringParameters?.recipient_id ||
      (event.rawUrl ? new URL(event.rawUrl).searchParams.get('recipient_id') : null);
    if (recipientId && !C.uuid(recipientId)) return C.fail(400, 'Invalid recipient.');
    const query = recipientId ? `id=eq.${recipientId}` : `twilio_sid=eq.${sid}`;
    const row = (await C.table('message_recipients', `${query}&select=id,message_id,member_id,twilio_sid,status&limit=1`))[0];
    if (!row) return {statusCode:204, body:''};
    if (row.twilio_sid && row.twilio_sid !== sid) return C.fail(400, 'Message mismatch.');
    if (row.status === 'delivered' && status !== 'delivered') return {statusCode:204, body:''};
    const rank = {sending:0, queued:1, sent:2, delivered:3, failed:3, undelivered:3, unknown:0};
    if ((rank[status] || 0) < (rank[row.status] || 0) && !['failed', 'undelivered'].includes(status)) {
      return {statusCode:204, body:''};
    }
    const at = new Date().toISOString();
    await C.table('message_recipients', `id=eq.${row.id}`, {method:'PATCH', body:{
      twilio_sid:sid, status, error_code:data.get('ErrorCode') || null,
      error_message:data.get('ErrorMessage')?.slice(0, 250) || null, updated_at:at
    }});
    if (data.get('ErrorCode') === '21610' && row.member_id) {
      await C.table('members', `id=eq.${row.member_id}`, {method:'PATCH', body:{
        sms_opt_in:false, sms_opt_out_date:at, updated_at:at
      }});
    }
    const all = await C.table('message_recipients', `message_id=eq.${row.message_id}&select=status,twilio_sid&limit=500`);
    await C.table('messages', `id=eq.${row.message_id}`, {method:'PATCH', body:{
      twilio_message_count:all.filter(r => r.twilio_sid || ['failed','undelivered','unknown'].includes(r.status)).length,
      successful_count:all.filter(r => ['queued','sent','delivered'].includes(r.status) && r.twilio_sid).length,
      failed_count:all.filter(r => ['failed','undelivered','unknown'].includes(r.status)).length
    }});
    return {statusCode:204, body:''};
  } catch (error) { return C.handle(error); }
};
