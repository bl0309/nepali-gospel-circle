-- Run after 001_ngc_messaging.sql. Existing installations keep their data.
alter table public.message_recipients drop constraint if exists message_recipients_status_check;
alter table public.message_recipients add constraint message_recipients_status_check
  check (status in ('queued','sending','sent','delivered','failed','undelivered','skipped','unknown'));

create table if not exists public.signup_requests (
  id uuid primary key default gen_random_uuid(),
  phone text not null unique check (phone ~ '^\+1[2-9][0-9]{2}[2-9][0-9]{6}$'),
  first_name text not null check (length(first_name) between 1 and 100),
  last_name text,
  email text,
  code_hash text not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
alter table public.signup_requests enable row level security;
-- Also repair grants on projects that ran an earlier copy of migration 001.
revoke all on table public.members, public.groups, public.member_groups,
  public.admin_profiles, public.messages, public.message_recipients,
  public.inbound_messages, public.signup_attempts, public.signup_requests
  from anon, authenticated;
grant select, insert, update, delete on table public.members, public.groups,
  public.member_groups, public.admin_profiles, public.messages,
  public.message_recipients, public.inbound_messages, public.signup_attempts,
  public.signup_requests to service_role;
create index if not exists signup_requests_expires_idx on public.signup_requests(expires_at);
alter table public.signup_attempts add column if not exists phone_hash text;
create index if not exists signup_attempts_phone_time_idx on public.signup_attempts(phone_hash,created_at desc);
alter table public.messages add column if not exists selected_count integer not null default 0;
update public.messages m set selected_count = (select count(*) from public.message_recipients r where r.message_id = m.id) where m.selected_count = 0;

-- Keep membership replacements all-or-nothing.
create or replace function public.replace_member_groups(p_member_id uuid, p_group_ids uuid[])
returns void language plpgsql security invoker set search_path = public as $$
begin
  delete from public.member_groups where member_id = p_member_id;
  insert into public.member_groups(member_id, group_id)
  select p_member_id, x from unnest(p_group_ids) as x
  on conflict do nothing;
end;
$$;
create or replace function public.replace_group_members(p_group_id uuid, p_member_ids uuid[])
returns void language plpgsql security invoker set search_path = public as $$
begin
  delete from public.member_groups where group_id = p_group_id;
  insert into public.member_groups(group_id, member_id)
  select p_group_id, x from unnest(p_member_ids) as x
  on conflict do nothing;
end;
$$;
revoke all on function public.replace_member_groups(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.replace_group_members(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.replace_member_groups(uuid, uuid[]) to service_role;
grant execute on function public.replace_group_members(uuid, uuid[]) to service_role;

-- Serialize checks by IP and phone so simultaneous requests cannot exceed SMS limits.
create or replace function public.claim_signup_attempt(p_ip_hash text, p_phone_hash text)
returns boolean language plpgsql security invoker set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext(p_ip_hash));
  perform pg_advisory_xact_lock(hashtext(p_phone_hash));
  if (select count(*) from public.signup_attempts
      where ip_hash = p_ip_hash and created_at >= now() - interval '1 hour') >= 20
     or (select count(*) from public.signup_attempts
      where phone_hash = p_phone_hash and created_at >= now() - interval '1 hour') >= 3 then
    return false;
  end if;
  insert into public.signup_attempts(ip_hash, phone_hash) values (p_ip_hash, p_phone_hash);
  return true;
end;
$$;
revoke all on function public.claim_signup_attempt(text, text) from public, anon, authenticated;
grant execute on function public.claim_signup_attempt(text, text) to service_role;
alter table public.members add column if not exists sms_consent_source text;
