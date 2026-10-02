# Church messaging setup and launch

The public site remains Hugo. `/admin/` is an HTML and JavaScript shell; private member data and SMS operations use Netlify Functions. Every admin Function validates a Supabase Auth user and an active role. The service key stays in Netlify. `/text-updates/` verifies a member's phone with a one-time SMS code before recording consent.

## 1. Create the Supabase database and first admin

1. Create a Supabase project. On the project creation screen, keep **Enable Data API** on, turn **Automatically expose new tables** off, and turn **Enable automatic RLS** on. The Functions use the Data API with a server key; the migrations explicitly grant that role access while denying browser roles. In **SQL Editor**, run these files **in order**: [`001_ngc_messaging.sql`](../supabase/migrations/001_ngc_messaging.sql), then [`002_messaging_reliability.sql`](../supabase/migrations/002_messaging_reliability.sql). If version 001 was already applied, run only 002. Both files should be saved as part of your deployment record.
2. In **Authentication → Providers**, enable email/password sign-in. Turn off public Auth signup; public text signup uses its own verified form and must not create admin accounts.
3. In **Authentication → Users → Add user → Create new user**, create the first leader with an email address and a strong password. Select **Auto Confirm User** only if you control and have verified that address; otherwise complete the email confirmation. Copy the user's UUID. The admin site currently has no invitation/password-setup screen, so use a user who already has a password. Then run:

   ```sql
   insert into public.admin_profiles(user_id, display_name, role)
   values ('00000000-0000-0000-0000-000000000000', 'Church leader', 'admin');
   ```

   Replace the sample UUID. For more leaders, use `admin`, `messaging_admin`, or `viewer`. Admin and messaging admin can manage and send. Viewer can read members, groups, dashboard counts, and message history but cannot use Inbox or make changes.
4. Copy the project URL, publishable/anon key, and server secret/service-role key from Supabase project settings. The server secret bypasses RLS and **must never be put in a Hugo template or public JavaScript**. The code supports both current `sb_secret_` keys and legacy service-role JWTs through the `SUPABASE_SERVICE_ROLE_KEY` variable.
5. Confirm RLS is enabled on all tables. The migration creates no browser-facing policies; the Netlify Functions use the server key after checking the Auth user and role.

## 2. Configure Twilio

1. Create a church-owned Twilio account and get an SMS-capable U.S. number. While on a trial, send only to phone numbers verified in that Twilio account or to Twilio's Virtual Phone in **Messaging → Virtual Phone**. The Virtual Phone number is `+18777804236` and can test SMS without carrier delivery or A2P 10DLC registration. Trial accounts cannot complete A2P 10DLC registration. See [Twilio's trial guide](https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account) and [Virtual Phone guide](https://www.twilio.com/docs/messaging/guides/guide-to-using-the-twilio-virtual-phone).
2. Prefer a Twilio Messaging Service with the number in its Sender Pool. Set `TWILIO_MESSAGING_SERVICE_SID`. If you do not use one, set `TWILIO_PHONE_NUMBER` to the church number in E.164 format. The Messaging Service SID takes precedence when both are set.
3. Configure the incoming SMS webhook as **HTTP POST** to:

   `https://nepaligospelcircle.com/.netlify/functions/twilio-incoming`

   In a Messaging Service, use its inbound settings; if it defers to the sender, configure the phone number webhook instead. Use the actual staging HTTPS domain while testing staging.
4. Each outgoing message supplies a signed status callback automatically; you do not need to enter a separate delivery callback in the Twilio Console. Its path is:

   `https://nepaligospelcircle.com/.netlify/functions/twilio-status`

   The app adds a recipient identifier in the callback URL so an early callback can still match the correct row. `SITE_URL` must use the canonical HTTPS origin with no redirect and must match the origin Twilio calls, including the staging origin during a staging test.
5. In a Messaging Service, review **Opt-Out Management** and enable Advanced Opt-Out for STOP, START, and HELP before member messaging. Keep the incoming webhook active so Twilio forwards these keywords with `OptOutType` and local consent stays in sync. The app records the command and returns empty TwiML; it relies on Twilio for the carrier response and does not send a duplicate HELP/STOP reply. Advanced Opt-Out requires Twilio Support to disable after activation. See [Twilio Advanced Opt-Out](https://www.twilio.com/docs/messaging/tutorials/advanced-opt-out).
6. Before messaging the congregation, upgrade the trial account. For a U.S. local number, complete [A2P 10DLC brand and campaign registration](https://www.twilio.com/docs/messaging/compliance/a2p-10dlc/quickstart); Twilio can block an unregistered local-number SMS with error `30034`, even when the app is configured correctly. For a toll-free number, complete [toll-free verification](https://www.twilio.com/docs/messaging/compliance/toll-free/console-onboarding) instead. The A2P registration asks for sample messages, consent details, and a public privacy policy; this repository does not yet contain a church privacy policy. The church must provide and review one before submitting its campaign. This code does not perform registration.

## 3. Set Netlify environment variables

In **Project configuration → Environment variables**, add the following for **Functions** (or all scopes if scope selection is unavailable), then redeploy. Never add real values to `.env.example`, `netlify.toml`, or the public site.

| Variable | Value |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase publishable/anon key for Auth calls |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase secret/service-role key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token for REST requests and webhook signatures |
| `TWILIO_PHONE_NUMBER` | Church number, if not using a Messaging Service |
| `TWILIO_MESSAGING_SERVICE_SID` | Preferred Messaging Service SID, if used |
| `SITE_URL` | Exact deployed HTTPS origin, for example `https://nepaligospelcircle.com` |

Netlify builds Hugo into `public/` and bundles `netlify/functions/`. Node 22 is selected for the build and Function runtime. A background Function handles broadcasts so a normal request does not wait for every Twilio API call. It is invoked by the authenticated send Function with a server-only signature. A protected staging site may block Twilio webhooks or the background invocation; use an accessible HTTPS staging origin for end-to-end tests.

Before testing the deployed site, commit and push the messaging changes from this repository. Netlify builds the pushed revision, so adding environment variables alone does not deploy local files. Check the Netlify deploy log for a successful Hugo build and confirm that the Functions tab lists `auth`, `admin-data`, `sms-signup`, `send-sms`, `send-sms-background`, `twilio-incoming`, and `twilio-status`. Environment variable changes take effect on a new deploy.

## 4. Safe test sequence

1. Locally run `hugo --minify --destination /tmp/ngc-check` and `node --test tests/*.test.js`. These tests mock Twilio and do not send real SMS.
2. If no staging environment exists, deploy this code to production but keep testing limited to the Twilio Virtual Phone or a verified leader-owned phone. Confirm `SITE_URL` is the exact production HTTPS origin, without a redirect. Avoid adding congregation members or using **All Church** until the setup and registration are complete. A normal U.S. mobile test can still fail with `30034` before A2P approval; the Virtual Phone avoids carrier delivery.
3. In **Messaging → Virtual Phone**, use `+18777804236` to test `/text-updates/`. Check that the member is **not** subscribed until the six-digit code is entered; read the code in the Virtual Phone, try a wrong code, then enter the correct code. Check the consent timestamp. From the Virtual Phone, send a reply, STOP, and START to the church sender; verify Inbox and consent status. A verified leader-owned U.S. phone can also be used if Twilio permits real delivery on the trial.
4. Add a member in Admin with consent and one without. Put both in a test group. Add the subscribed member to a second group. Send to both groups only after the confirmation dialog; verify just one message reaches that phone. Check inactive and opted-out members are skipped.
5. Open Message History. It initially shows queued rows, then the worker updates accepted/failed results. Use **Refresh statuses** and inspect Twilio delivery callbacks. If the worker did not start, open that message and choose **Resume queued**. Resume only queues recipients with no Twilio SID; it does not resend accepted messages.
6. Send replies from a known and an unknown phone; check Inbox, open the phone's conversation to see received and sent messages together, and test Mark read. Send STOP and confirm a later broadcast excludes the number. Send START and confirm local consent is restored only when Twilio forwards it.
7. Create a `viewer` user and confirm direct Function calls cannot send, edit, or read Inbox. Confirm logout and session refresh work.
8. Test a short English SMS and a Nepali SMS on leaders' numbers. Review Twilio usage and the segment estimate before inviting members or broadcasting to the congregation.

## Operational notes and current limits

- Member signup and outbound sending accept U.S. numbers. The Inbox can also store unknown international E.164 senders. Sending uses up to five concurrent Twilio calls and at most 100 resolved recipients.
- The composer and send Function enforce Twilio's SMS length limits: 1,600 GSM-7 encoded units or 700 Unicode units. The preview estimates segments and total segments for the selected audience; verify actual billing in Twilio.
- The Inbox lists the 200 most recent received messages. Opening a phone's conversation combines its 200 most recent received messages and 200 most recent outbound recipient records. Older records remain in Supabase.
- A public signup SMS code expires after 10 minutes. Consent source is recorded as `public_verified`, `leader_confirmed`, or `sms_start`. Attempts are limited per phone and IP; consent is recorded only after the code is confirmed. An existing opted-out number must text START before signup can proceed.
- If a Twilio network request has an **unknown** outcome, the row is marked `unknown` and is not automatically retried. A row left `sending` after a worker interruption also needs review. In Supabase SQL Editor, find them with `select id, phone, status, created_at from public.message_recipients where status in ('unknown', 'sending') order by created_at desc;`. Check the Twilio Console before changing either status or trying another send; a blind retry could create a duplicate text.
- Expired pending signups are cleaned on later signups. If the signup page is no longer used, an admin can remove them with `delete from public.signup_requests where expires_at < now();`.
- The **All Church** audience means every active subscribed member; the seeded group named **All Church** is an ordinary manually managed group and may be empty. Queued rows with no Twilio SID can be safely resumed from Message History. The database claim prevents two workers from intentionally sending the same queued row.
- No scheduling, templates, Inbox reply button, password-reset screen, or automated import are included. The best next additions are a staff password reset flow and an operational review screen for `unknown`/stale `sending` rows.
