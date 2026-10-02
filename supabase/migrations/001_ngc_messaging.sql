create extension if not exists pgcrypto;
create table public.members (
 id uuid primary key default gen_random_uuid(), first_name text not null check (length(first_name) between 1 and 100), last_name text,
 phone text not null unique check (phone ~ '^\+1[2-9][0-9]{2}[2-9][0-9]{6}$'), email text, active boolean not null default true,
 sms_opt_in boolean not null default false, sms_opt_in_date timestamptz, sms_opt_out_date timestamptz, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.groups (id uuid primary key default gen_random_uuid(), name text not null unique, description text, archived boolean not null default false, created_at timestamptz not null default now());
create table public.member_groups (member_id uuid not null references public.members(id) on delete cascade, group_id uuid not null references public.groups(id) on delete cascade, created_at timestamptz not null default now(), primary key(member_id,group_id));
create table public.admin_profiles (user_id uuid primary key references auth.users(id) on delete cascade, display_name text, role text not null check(role in ('admin','messaging_admin','viewer')), active boolean not null default true, created_at timestamptz not null default now());
create table public.messages (id uuid primary key default gen_random_uuid(), body text not null check(length(body) between 1 and 1600), request_key uuid not null unique, sender_user_id uuid references auth.users(id), audience_type text not null check(audience_type in ('individual','selected','group','multiple_groups','all')), audience_description text, twilio_message_count integer not null default 0, successful_count integer not null default 0, failed_count integer not null default 0, created_at timestamptz not null default now());
create table public.message_recipients (id uuid primary key default gen_random_uuid(), message_id uuid not null references public.messages(id) on delete cascade, member_id uuid references public.members(id) on delete set null, phone text not null, twilio_sid text unique, status text not null check(status in ('queued','sent','delivered','failed','undelivered','skipped')), error_code text, error_message text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.inbound_messages (id uuid primary key default gen_random_uuid(), twilio_sid text not null unique, from_phone text not null, to_phone text, member_id uuid references public.members(id) on delete set null, body text, received_at timestamptz not null default now(), read boolean not null default false);
create table public.signup_attempts (id uuid primary key default gen_random_uuid(), ip_hash text not null, created_at timestamptz not null default now());
create index members_active_optin_idx on public.members(active,sms_opt_in);
create index member_groups_group_idx on public.member_groups(group_id);
create index recipients_message_idx on public.message_recipients(message_id);
create index inbound_phone_time_idx on public.inbound_messages(from_phone,received_at desc);
create index inbound_unread_idx on public.inbound_messages(read,received_at desc);
create index messages_created_idx on public.messages(created_at desc);
create index signup_attempts_hash_time_idx on public.signup_attempts(ip_hash,created_at desc);
alter table public.members enable row level security;
alter table public.groups enable row level security;
alter table public.member_groups enable row level security;
alter table public.messages enable row level security;
alter table public.message_recipients enable row level security;
alter table public.inbound_messages enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.signup_attempts enable row level security;
-- Only the Netlify Functions' server key may reach these tables through the Data API.
-- Explicit grants keep the app working when automatic table exposure is disabled.
revoke all on table public.members, public.groups, public.member_groups,
  public.admin_profiles, public.messages, public.message_recipients,
  public.inbound_messages, public.signup_attempts from anon, authenticated;
grant select, insert, update, delete on table public.members, public.groups,
  public.member_groups, public.admin_profiles, public.messages,
  public.message_recipients, public.inbound_messages, public.signup_attempts
  to service_role;
-- No browser-facing policies: Netlify Functions check Auth and roles, then use the service role.
insert into public.groups(name) values ('All Church'),('Leadership'),('Worship Team'),('Youth / Jawan Sangati'),('Prayer & Care'),('Families'),('Children''s Ministry') on conflict(name) do nothing;
