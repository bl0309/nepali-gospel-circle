const C = require('./lib/core');

async function profileFor(userId) {
  const profile = (await C.table('admin_profiles',
    `user_id=eq.${encodeURIComponent(userId)}&select=user_id,role,active,display_name`))[0];
  if (!profile?.active || !['admin', 'messaging_admin', 'viewer'].includes(profile.role)) {
    throw Object.assign(new Error('Access denied.'), {status:403});
  }
  return profile;
}

async function refresh(event) {
  const refreshToken = C.cookie(event, 'ngc_refresh');
  if (!refreshToken) return C.fail(401, 'Your session has expired. Please sign in again.');
  const res = await fetch(`${C.env('SUPABASE_URL').replace(/\/$/, '')}/auth/v1/token?grant_type=refresh_token`, {
    method:'POST',
    headers:{apikey:C.env('SUPABASE_ANON_KEY'), 'Content-Type':'application/json'},
    body:JSON.stringify({refresh_token:refreshToken})
  });
  if (!res.ok) return {...C.fail(401, 'Your session has expired. Please sign in again.'), ...C.cookies('', '', 0)};
  const tokens = await res.json();
  const profile = await profileFor(tokens.user.id);
  return {...C.json(200, {profile}), ...C.cookies(tokens.access_token, tokens.refresh_token, tokens.expires_in)};
}

exports.handler = async event => {
  try {
    if (!C.method(event, ['GET', 'POST'])) return C.fail(405, 'Method not allowed.');
    if (event.httpMethod === 'GET') {
      try {
        const profile = await C.requireRole(event);
        return C.json(200, {profile});
      } catch (error) {
        if (error.status !== 401) throw error;
        return refresh(event);
      }
    }
    const data = C.parse(event);
    if (data.action === 'logout') {
      const accessToken = C.cookie(event, 'ngc_access');
      if (accessToken) {
        try {
          await fetch(`${C.env('SUPABASE_URL').replace(/\/$/, '')}/auth/v1/logout`, {
            method:'POST', headers:{apikey:C.env('SUPABASE_ANON_KEY'), Authorization:`Bearer ${accessToken}`},
            signal:AbortSignal.timeout(3000)
          });
        } catch { /* Browser cookies are cleared even if Supabase is temporarily unavailable. */ }
      }
      return {...C.json(200, {ok:true}), ...C.cookies('', '', 0)};
    }
    if (data.action !== 'login' || typeof data.email !== 'string' || typeof data.password !== 'string' ||
        data.email.length > 254 || data.password.length > 500) {
      return C.fail(400, 'Enter your email and password.');
    }
    const res = await fetch(`${C.env('SUPABASE_URL').replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
      method:'POST', headers:{apikey:C.env('SUPABASE_ANON_KEY'), 'Content-Type':'application/json'},
      body:JSON.stringify({email:data.email, password:data.password})
    });
    if (!res.ok) return C.fail(401, 'Invalid email or password.');
    const tokens = await res.json();
    const profile = await profileFor(tokens.user.id);
    return {...C.json(200, {profile}), ...C.cookies(tokens.access_token, tokens.refresh_token, tokens.expires_in)};
  } catch (error) { return C.handle(error); }
};
