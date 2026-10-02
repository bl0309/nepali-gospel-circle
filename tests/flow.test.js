const test = require('node:test');
const assert = require('node:assert/strict');
const {createHmac, randomUUID} = require('node:crypto');
const signup = require('../netlify/functions/sms-signup').handler;
const send = require('../netlify/functions/send-sms').handler;
const background = require('../netlify/functions/send-sms-background').handler;
const status = require('../netlify/functions/twilio-status').handler;
const incoming = require('../netlify/functions/twilio-incoming').handler;
const auth = require('../netlify/functions/auth').handler;
const adminData = require('../netlify/functions/admin-data').handler;
const job = require('../netlify/functions/lib/job');

const userId = '11111111-1111-4111-8111-111111111111';
const groupId = '22222222-2222-4222-8222-222222222222';
process.env.SUPABASE_URL = 'https://supabase.test';
process.env.SUPABASE_ANON_KEY = 'anon-test';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-test';
process.env.TWILIO_ACCOUNT_SID = `AC${'a'.repeat(32)}`;
process.env.TWILIO_AUTH_TOKEN = 'twilio-test';
process.env.TWILIO_PHONE_NUMBER = '+14695550000';
process.env.SITE_URL = 'https://site.test';

function fixture() {
  const tables = Object.fromEntries(['members','groups','member_groups','admin_profiles','messages','message_recipients','inbound_messages','signup_attempts','signup_requests'].map(x => [x, []]));
  tables.admin_profiles.push({user_id:userId, role:'admin', active:true, display_name:'Leader'});
  tables.groups.push({id:groupId, name:'Test', archived:false});
  const twilio = [];
  let twilioHook = null;
  const response = (value, code=200) => new Response(code===204 ? null : JSON.stringify(value), {status:code});
  const matches = (row, params) => {
    for (const [key, value] of params) {
      if (['select','order','limit','on_conflict'].includes(key)) continue;
      if (value.startsWith('eq.') && String(row[key] ?? '') !== value.slice(3)) return false;
      if (value.startsWith('in.(') && !value.slice(4,-1).split(',').includes(String(row[key]))) return false;
      if (value === 'is.null' && row[key] != null) return false;
      if (value.startsWith('gte.') && !(row[key] >= value.slice(4))) return false;
      if (value.startsWith('lt.') && !(row[key] < value.slice(3))) return false;
    }
    return true;
  };
  const fetchMock = async (input, init={}) => {
    const url = new URL(String(input));
    if (url.hostname === 'supabase.test') {
      if (url.pathname === '/auth/v1/user') return response({id:userId});
      if (url.pathname === '/auth/v1/token' && url.searchParams.get('grant_type') === 'refresh_token') {
        return response({user:{id:userId}, access_token:'fresh-token', refresh_token:'fresh-refresh', expires_in:3600});
      }
      if (url.pathname === '/auth/v1/logout') return response({}, 204);
      if (url.pathname === '/rest/v1/rpc/claim_signup_attempt') {
        const {p_ip_hash, p_phone_hash} = JSON.parse(init.body);
        const recent = tables.signup_attempts.filter(x => Date.now() - new Date(x.created_at).getTime() < 3600000);
        if (recent.filter(x => x.ip_hash === p_ip_hash).length >= 20 ||
            recent.filter(x => x.phone_hash === p_phone_hash).length >= 3) return response(false);
        tables.signup_attempts.push({id:randomUUID(), ip_hash:p_ip_hash, phone_hash:p_phone_hash, created_at:new Date().toISOString()});
        return response(true);
      }
      const table = url.pathname.split('/').at(-1);
      if (!tables[table]) throw Error(`Unknown fake table: ${table}`);
      const rows = tables[table];
      const chosen = rows.filter(row => matches(row, url.searchParams));
      const method = init.method || 'GET';
      if (method === 'GET') return response(chosen.slice(0, Number(url.searchParams.get('limit') || 1000)));
      if (method === 'POST') {
        const payload = JSON.parse(init.body);
        if (table === 'inbound_messages' && rows.some(row => row.twilio_sid === payload.twilio_sid) &&
            init.headers.Prefer?.includes('ignore-duplicates')) return response([]);
        const inserted = (Array.isArray(payload) ? payload : [payload]).map(item => ({id:randomUUID(), created_at:new Date().toISOString(), ...(table==='signup_requests'?{attempts:0}:{}), ...item}));
        rows.push(...inserted);
        return response(inserted);
      }
      if (method === 'PATCH') {
        const payload = JSON.parse(init.body);
        chosen.forEach(row => Object.assign(row, payload));
        return response(chosen);
      }
      if (method === 'DELETE') {
        chosen.forEach(row => rows.splice(rows.indexOf(row), 1));
        return response(null, 204);
      }
    }
    if (url.hostname === 'api.twilio.com') {
      const params = new URLSearchParams(init.body);
      twilio.push(params);
      const sid = `SM${String(twilio.length).padStart(32, '0')}`;
      if (twilioHook) await twilioHook(sid, params);
      return response({sid, status:'queued'});
    }
    if (url.hostname === 'site.test' && url.pathname.endsWith('/send-sms-background')) return response({}, 202);
    throw Error(`Unexpected fetch: ${url}`);
  };
  return {tables, twilio, fetchMock, setTwilioHook:hook => {twilioHook=hook}};
}

const event = (body, cookie='') => ({httpMethod:'POST', path:'/.netlify/functions/sms-signup',
  headers:{host:'site.test', origin:'https://site.test', cookie, 'x-nf-client-connection-ip':'192.0.2.10'},
  queryStringParameters:{}, body:JSON.stringify(body)});

test('public signup needs the SMS code before consent becomes active', async () => {
  const old = global.fetch, fake = fixture(); global.fetch = fake.fetchMock;
  try {
    const request = await signup(event({action:'request', first_name:'Mina', last_name:'Lamsal', phone:'469-555-1234', consent:true}));
    assert.equal(request.statusCode, 200);
    const requestId = JSON.parse(request.body).request_id;
    assert.equal(fake.tables.members.length, 0);
    assert.equal(fake.twilio.length, 1);
    const bad = await signup(event({action:'confirm', request_id:requestId, code:'000001'}));
    assert.equal(bad.statusCode, 400);
    assert.equal(fake.tables.members.length, 0);
    const code = fake.twilio[0].get('Body').match(/\b\d{6}\b/)[0];
    const confirmed = await signup(event({action:'confirm', request_id:requestId, code}));
    assert.equal(confirmed.statusCode, 200);
    assert.equal(fake.tables.members[0].sms_opt_in, true);
    assert.equal(fake.tables.members[0].sms_consent_source, 'public_verified');
    assert.equal(fake.tables.members[0].phone, '+14695551234');
    assert.equal(fake.tables.signup_requests.length, 0);
  } finally { global.fetch = old; }
});

test('verified admin queues once and background worker sends only eligible members', async () => {
  const old = global.fetch, fake = fixture(); global.fetch = fake.fetchMock;
  try {
    const a = {id:randomUUID(), phone:'+14695551234', active:true, sms_opt_in:true};
    const b = {id:randomUUID(), phone:'+14695551235', active:true, sms_opt_in:false};
    fake.tables.members.push(a, b);
    fake.tables.member_groups.push({member_id:a.id,group_id:groupId},{member_id:a.id,group_id:groupId},{member_id:b.id,group_id:groupId});
    const payload = {audience:'group', group_ids:[groupId], member_ids:[], body:'Sunday at 1 PM', request_key:randomUUID()};
    const submitted = await send(event(payload, 'ngc_access=valid'));
    assert.equal(submitted.statusCode, 202);
    const summary = JSON.parse(submitted.body);
    assert.equal(summary.queued, 1);
    assert.equal(fake.twilio.length, 0);
    const duplicate = await send(event(payload, 'ngc_access=valid'));
    assert.equal(JSON.parse(duplicate.body).already_submitted, true);
    const workerEvent = event({message_id:summary.id, signature:job.signature(summary.id)});
    const processed = await background(workerEvent);
    assert.equal(processed.statusCode, 204);
    assert.equal(fake.twilio.length, 1);
    assert.equal(fake.tables.message_recipients.length, 1);
    assert.equal(fake.tables.message_recipients[0].status, 'queued');
    assert.ok(fake.tables.message_recipients[0].twilio_sid);
    await background(workerEvent);
    assert.equal(fake.twilio.length, 1);
    const recipient = fake.tables.message_recipients[0];
    const query = `?recipient_id=${recipient.id}`;
    const params = new URLSearchParams({MessageSid:recipient.twilio_sid, MessageStatus:'delivered'});
    const signedUrl = `https://site.test/.netlify/functions/twilio-status${query}`;
    const input = signedUrl + [...params.keys()].sort().map(key => key + params.get(key)).join('');
    const signature = createHmac('sha1', process.env.TWILIO_AUTH_TOKEN).update(input).digest('base64');
    const callback = await status({httpMethod:'POST',path:'/.netlify/functions/twilio-status',
      rawUrl:signedUrl,queryStringParameters:{recipient_id:recipient.id},headers:{'x-twilio-signature':signature},body:params.toString()});
    assert.equal(callback.statusCode, 204);
    assert.equal(recipient.status, 'delivered');
    assert.equal(fake.tables.messages[0].successful_count, 1);
  } finally { global.fetch = old; }
});

test('expired access token refreshes into new secure cookies', async () => {
  const old = global.fetch, fake = fixture(); global.fetch = fake.fetchMock;
  try {
    const result = await auth({httpMethod:'GET',headers:{host:'site.test',cookie:'ngc_refresh=old-refresh'},body:''});
    assert.equal(result.statusCode, 200);
    assert.match(result.multiValueHeaders['Set-Cookie'][0], /ngc_access=fresh-token/);
    assert.match(result.multiValueHeaders['Set-Cookie'][1], /ngc_refresh=fresh-refresh/);
  } finally { global.fetch = old; }
});


test('a delivery callback arriving before the Twilio API response is preserved', async () => {
  const old = global.fetch, fake = fixture(); global.fetch = fake.fetchMock;
  try {
    fake.tables.members.push({id:randomUUID(), phone:'+14695551234', active:true, sms_opt_in:true});
    const payload = {audience:'all', group_ids:[], member_ids:[], body:'Hello', request_key:randomUUID()};
    const submitted = await send(event(payload, 'ngc_access=valid'));
    const id = JSON.parse(submitted.body).id;
    fake.setTwilioHook(async (sid, params) => {
      const callbackUrl = params.get('StatusCallback');
      const url = new URL(callbackUrl);
      const form = new URLSearchParams({MessageSid:sid, MessageStatus:'delivered'});
      const input = callbackUrl + [...form.keys()].sort().map(key => key + form.get(key)).join('');
      const signature = createHmac('sha1', process.env.TWILIO_AUTH_TOKEN).update(input).digest('base64');
      const result = await status({httpMethod:'POST',path:url.pathname,rawUrl:callbackUrl,
        queryStringParameters:{recipient_id:url.searchParams.get('recipient_id')},
        headers:{'x-twilio-signature':signature},body:form.toString()});
      assert.equal(result.statusCode, 204);
    });
    await background(event({message_id:id, signature:job.signature(id)}));
    assert.equal(fake.tables.message_recipients[0].status, 'delivered');
    assert.equal(fake.tables.messages[0].successful_count, 1);
    await background(event({message_id:id, signature:job.signature(id)}));
    assert.equal(fake.twilio.length, 1);
  } finally { global.fetch = old; }
});

test('signed STOP saves the reply and blocks future broadcasts', async () => {
  const old = global.fetch, fake = fixture(); global.fetch = fake.fetchMock;
  try {
    const member = {id:randomUUID(), phone:'+14695551234', active:true, sms_opt_in:true};
    fake.tables.members.push(member);
    const form = new URLSearchParams({MessageSid:`SM${'f'.repeat(32)}`, From:member.phone,
      To:process.env.TWILIO_PHONE_NUMBER, Body:'STOP'});
    const url = 'https://site.test/.netlify/functions/twilio-incoming';
    const input = url + [...form.keys()].sort().map(key => key + form.get(key)).join('');
    const signature = createHmac('sha1', process.env.TWILIO_AUTH_TOKEN).update(input).digest('base64');
    const result = await incoming({httpMethod:'POST',path:'/.netlify/functions/twilio-incoming',
      headers:{'x-twilio-signature':signature},body:form.toString()});
    assert.equal(result.statusCode, 200);
    assert.equal(member.sms_opt_in, false);
    assert.ok(member.sms_opt_out_date);
    assert.equal(fake.tables.inbound_messages.length, 1);
    const submitted = await send(event({audience:'all',group_ids:[],member_ids:[],body:'Hello',request_key:randomUUID()},'ngc_access=valid'));
    assert.equal(submitted.statusCode, 400);
    assert.equal(fake.twilio.length, 0);
  } finally { global.fetch = old; }
});

test('public code requests are limited per phone and opted-out numbers are blocked', async () => {
  const old = global.fetch, fake = fixture(); global.fetch = fake.fetchMock;
  try {
    const input = {action:'request', first_name:'Mina', phone:'469-555-1234', consent:true};
    for (let n=0;n<3;n++) assert.equal((await signup(event(input))).statusCode,200);
    assert.equal((await signup(event(input))).statusCode,429);
    assert.equal(fake.twilio.length,3);
    fake.tables.members.push({id:randomUUID(),phone:'+14695551236',active:true,sms_opt_in:false,sms_opt_out_date:new Date().toISOString()});
    assert.equal((await signup(event({...input,phone:'469-555-1236'}))).statusCode,400);
    assert.equal(fake.twilio.length,3);
  } finally { global.fetch = old; }
});

test('background sender rejects forged work requests', async () => {
  const result = await background(event({message_id:randomUUID(),signature:'0'.repeat(64)}));
  assert.equal(result.statusCode,403);
});

test('send rejects messages exceeding encoded SMS limits before saving', async () => {
  const old = global.fetch, fake = fixture(); global.fetch = fake.fetchMock;
  try {
    for (const body of ['क'.repeat(701), '^'.repeat(801), '🙂'.repeat(351)]) {
      const result = await send(event({audience:'all', group_ids:[], member_ids:[], body,
        request_key:randomUUID()}, 'ngc_access=valid'));
      assert.equal(result.statusCode, 400);
      assert.match(JSON.parse(result.body).error, /encoded characters/);
    }
    assert.equal(fake.tables.messages.length, 0);
    assert.equal(fake.twilio.length, 0);
  } finally { global.fetch = old; }
});

test('phone conversation combines sent and received messages and denies viewers', async () => {
  const old = global.fetch, fake = fixture(); global.fetch = fake.fetchMock;
  try {
    const phone = '+14695551234', messageId = randomUUID();
    fake.tables.messages.push({id:messageId,body:'Sunday service',created_at:'2026-10-01T12:00:00Z'});
    fake.tables.message_recipients.push({id:randomUUID(),message_id:messageId,phone,
      status:'delivered',created_at:'2026-10-01T12:00:00Z'});
    fake.tables.inbound_messages.push({id:randomUUID(),from_phone:phone,body:'Thank you',
      received_at:'2026-10-01T12:01:00Z'});
    const request={...event({},'ngc_access=valid'),httpMethod:'GET',
      queryStringParameters:{type:'conversation',phone}};
    const result=await adminData(request);
    assert.equal(result.statusCode,200);
    assert.deepEqual(JSON.parse(result.body).entries.map(row=>[row.direction,row.body]),
      [['outbound','Sunday service'],['inbound','Thank you']]);
    fake.tables.admin_profiles[0].role='viewer';
    assert.equal((await adminData(request)).statusCode,403);
  } finally { global.fetch = old; }
});


test('replayed STOP webhook does not undo a newer START', async () => {
  const old = global.fetch, fake = fixture(); global.fetch = fake.fetchMock;
  try {
    const member = {id:randomUUID(), phone:'+14695551234', active:true, sms_opt_in:true};
    fake.tables.members.push(member);
    async function deliver(sid, body) {
      const form = new URLSearchParams({MessageSid:sid,From:member.phone,To:process.env.TWILIO_PHONE_NUMBER,Body:body});
      const url='https://site.test/.netlify/functions/twilio-incoming';
      const input=url+[...form.keys()].sort().map(key=>key+form.get(key)).join('');
      const signature=createHmac('sha1',process.env.TWILIO_AUTH_TOKEN).update(input).digest('base64');
      return incoming({httpMethod:'POST',path:'/.netlify/functions/twilio-incoming',headers:{'x-twilio-signature':signature},body:form.toString()});
    }
    const stopSid=`SM${'a'.repeat(32)}`, startSid=`SM${'b'.repeat(32)}`;
    await deliver(stopSid,'STOP');
    assert.equal(member.sms_opt_in,false);
    await deliver(startSid,'START');
    assert.equal(member.sms_opt_in,true);
    await deliver(stopSid,'STOP');
    assert.equal(member.sms_opt_in,true);
    assert.equal(fake.tables.inbound_messages.length,2);
  } finally { global.fetch=old; }
});
