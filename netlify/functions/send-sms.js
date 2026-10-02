const C = require('./lib/core');
const job = require('./lib/job');

async function resume(data) {
  if (!C.uuid(data.message_id)) return C.fail(400, 'Invalid message.');
  const message = (await C.table('messages', `id=eq.${data.message_id}&select=id&limit=1`))[0];
  if (!message) return C.fail(404, 'Message not found.');
  const pending = await C.table('message_recipients',
    `message_id=eq.${message.id}&status=eq.queued&twilio_sid=is.null&select=id&limit=101`);
  if (!pending.length) return C.json(200, {id:message.id, queued:0});
  const started = await job.invoke(message.id).catch(() => false);
  return C.json(202, {id:message.id, queued:pending.length, worker_started:started});
}

exports.handler = async event => {
  try {
    if (!C.method(event, ['POST'])) return C.fail(405, 'Method not allowed.');
    const profile = await C.requireRole(event, true);
    const data = C.parse(event);
    if (data.action === 'resume') return resume(data);
    const body = typeof data.body === 'string' ? data.body.trim() : '';
    if (!body) return C.fail(400, 'Enter a message.');
    const estimate = C.segments(body);
    const maxUnits = estimate.encoding === 'Unicode' ? 700 : 1600;
    if (estimate.units > maxUnits) return C.fail(400,
      `${estimate.encoding} SMS is limited to ${maxUnits} encoded characters. Shorten the message.`);
    if (!C.uuid(data.request_key)) return C.fail(400, 'Refresh the page and try again.');
    if (!['all', 'group', 'individual'].includes(data.audience) ||
        !C.ids(data.group_ids || []) || !C.ids(data.member_ids || [])) return C.fail(400, 'Invalid audience.');
    if (data.audience === 'group' && !data.group_ids.length ||
        data.audience === 'individual' && !data.member_ids.length) return C.fail(400, 'Choose recipients.');
    if (!process.env.TWILIO_MESSAGING_SERVICE_SID && !process.env.TWILIO_PHONE_NUMBER) {
      return C.fail(503, 'Twilio configuration is missing.');
    }
    const existing = (await C.table('messages', `request_key=eq.${data.request_key}&select=id&limit=1`))[0];
    if (existing) return C.json(200, {id:existing.id, already_submitted:true});
    const [members, links, groups] = await Promise.all([
      C.table('members', 'select=id,phone,active,sms_opt_in&limit=500'),
      C.table('member_groups', 'select=member_id,group_id&limit=1000'),
      C.table('groups', 'select=id,name,archived&limit=100')
    ]);
    if (data.audience === 'group' && data.group_ids.some(id => !groups.some(g => g.id === id && !g.archived))) {
      return C.fail(400, 'Choose active groups.');
    }
    const {chosen, skipped, selected} = C.selectRecipients(members, links, data.audience, data.group_ids, data.member_ids);
    if (!chosen.length) return C.fail(400, 'No active, opted-in recipients found.');
    if (chosen.length > 100) return C.fail(400, 'Too many recipients.');
    const audience_description = data.audience === 'all' ? 'All Church' :
      data.audience === 'group' ? groups.filter(g => data.group_ids.includes(g.id)).map(g => g.name).join(', ') :
      `${data.member_ids.length} selected members`;
    const audience_type = data.audience === 'group' && data.group_ids.length > 1 ? 'multiple_groups' :
      data.audience === 'individual' && data.member_ids.length > 1 ? 'selected' : data.audience;
    let message;
    try {
      message = (await C.table('messages', '', {method:'POST', prefer:'return=representation', body:{
        body, request_key:data.request_key, sender_user_id:profile.user_id, audience_type, audience_description,
        twilio_message_count:0, selected_count:chosen.length
      }}))[0];
    } catch (error) {
      if (error.status === 409) {
        const duplicate = (await C.table('messages', `request_key=eq.${data.request_key}&select=id&limit=1`))[0];
        if (duplicate) return C.json(200, {id:duplicate.id, already_submitted:true});
      }
      throw error;
    }
    try {
      await C.table('message_recipients', '', {method:'POST', body:chosen.map(m => ({
        message_id:message.id, member_id:m.id, phone:m.phone, status:'queued'
      }))});
    } catch (error) {
      await C.table('messages', `id=eq.${message.id}`, {method:'DELETE'});
      throw error;
    }
    const started = await job.invoke(message.id).catch(() => false);
    return C.json(202, {id:message.id, selected, queued:chosen.length, skipped, worker_started:started});
  } catch (error) { return C.handle(error); }
};
