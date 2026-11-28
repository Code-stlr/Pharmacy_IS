# Neon database and managed Better Auth

## Ownership

Neon Postgres stores the existing pharmacy schema in `public`. Managed Better Auth owns credentials, email verification, Google OAuth and persistent sessions in `neon_auth`. React uses the official `@neon/auth` SDK; no passwords or auth tokens are placed in browser storage. Django retains user IDs, groups, branch assignments and patient ownership through `pharmacy_neonidentity`.

The frontend obtains the public Auth URL from `/api/auth/config/` at runtime, so a deployment does not need a separate frontend auth build variable. The database password stays on the backend. The frontend attaches the SDK-issued JWT and managed session ID to API requests. Django checks signature, issuer, audience, expiry, current email verification, bans and the live session row before applying the local account's permissions. Provider logout and password resets therefore revoke API access immediately. CSRF remains required on writes, including profile completion and legacy linking.

## Configuration

1. In `.env`, set the `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSSLMODE=require` and `PGCHANNELBINDING=require` values from Neon. These take precedence over `POSTGRES_*`. Use the plain hostname for `PGHOST`, without an HTTP URL.
2. Set `NEON_AUTH_URL` to the full URL shown under Neon Settings → Better Auth. This differs from `PGHOST`. The backend must connect to the same Neon branch as this Auth service, because it checks managed sessions in that branch.
3. For Compose, select `docker-compose.yml` and `docker-compose.external-db.yml` through `COMPOSE_FILE`. Windows separates paths with `;`; Linux uses `:`. This disables the bundled database service. Install backend requirements and frontend packages when running without Docker.
4. Enable Sign-up with Email, Sign-in with Email, Verify at Sign-up → Verification code, and Revoke sessions on password reset. Allow localhost while developing. Add the real app domain to trusted redirect domains before deployment.
5. Google's shared keys and Neon's shared email sender are suitable for development. Production needs your own Google OAuth application and email provider. Verification links require custom email delivery; this implementation uses codes.

`NEON_AUTH_ISSUER` and `NEON_AUTH_AUDIENCE` can override the default Auth URL origin if the provider's token contract changes. The public keys come from `NEON_AUTH_URL/.well-known/jwks.json`. Do not set these to arbitrary client-supplied URLs.

With `NEON_AUTH_URL` enabled, the old signup/login endpoints return `410 use_neon_auth` and old Django login cookies cannot authenticate protected APIs. An unset URL explicitly retains the original local auth mode for isolated acceptance fixtures and development. Do not unset it on a Neon Auth deployment.

## User flows

- `/register`: creates a managed identity with email, matching password/confirmation and name, then opens `/verify-email`. A mismatch is shown on the confirmation field before any signup request. It grants no pharmacy access before verification.
- `/verify-email`: accepts a six-digit OTP; resend has a 60-second UI cooldown and the provider's server-side rate limits. Provider errors, including rate limits and expired/invalid codes, remain visible. Verification returns to sign-in.
- `/login`: email/password sign-in, Keep me signed in, and Google OAuth. The SDK restores/refreshes its managed session on reload. API authentication runs again on window focus and rejected sessions clear the workspace.
- `/forgot-password` → `/reset-password`: requests a reset OTP and accepts it with a matching new password. Neon invalidates existing sessions. The response does not claim an email account exists.
- First verified login opens `/complete-account`. New users enter patient details; role input cannot grant staff access. Google sign-ups use the same completion step.
- Existing staff/patients choose `/link-account`, then prove ownership with the old pharmacy username and password. The link preserves the existing user ID, role, branch and records, sets the verified email, and disables the old local password. It is never based on matching email alone. Linking is limited by shared database counters to five attempts per username and twenty per client IP per five minutes.
- Administrators and pharmacists use the same sign-in page as patients. The [public demo staff accounts](../DEMO_ACCOUNTS.md) are provisioned with email-shaped login IDs, credentials, pharmacy roles and branch assignments ahead of time; they sign in directly without personal Google accounts, real mailboxes or account linking. Their initial passwords and two-per-branch assignments are documented for the university demo. Legacy accounts can still use the linking flow. Public signup cannot select a staff role.
- Logout clears the application branch session and calls Neon sign-out. Other browser tabs are refreshed through the SDK; the app rechecks its API identity on focus.

Managed email/password changes happen through the provider; local profile/admin writes cannot change credentials for linked accounts. Staff have **My profile → Change password**, which calls Neon's `changePassword` with the current/new password and revokes other sessions, without email. Login-only staff IDs cannot receive reset mail in a project-managed inbox; forgotten passwords require an authorized operator's managed Auth recovery. Patients retain email-based recovery. Admin-created local legacy accounts can still be linked using their initial credentials. A Google/Neon identity cannot select an existing patient record by ID during public signup.

The auth UI uses “Create account”, a single “Sign in” navigation action per recovery/signup view, an outlined primary Sign in button, and Google's official colour logo beside “Continue with Google”. The locally hosted logo at `frontend/public/google-g.png` was downloaded from [Google's branding asset](https://developers.google.com/static/identity/images/g-logo.png), linked from the [Google sign-in branding guidance](https://developers.google.com/identity/branding-guidelines).

On 2026-11-28, the owner approved the nine public staff demo accounts in `DEMO_ACCOUNTS.md`. They were provisioned after validating a backup of both `public` and `neon_auth` at `.private/database-migration/demo-staff-20261128T082649Z/`. Existing domain records and account mappings were preserved. All nine accounts signed in through live managed Auth, reached the expected pharmacy role/branch, and passed the appropriate admin-access checks. The password-change flow was tested live with the initial admin password restored afterward; evidence is in ignored `.private/demo-staff-live-verification.json`. The seed was run twice and the second run created zero accounts or password changes. The browser also confirmed direct pharmacist login and the staff password-change dialog. No email verification messages were sent for these login-only IDs.

## Migration completed on 2026-11-28

The source was this computer's PostgreSQL 17 database on `127.0.0.1:55437`, not the Azure deployment. Neon contained an older copy. After explicit approval to replace it, both application schemas were backed up in `.private/database-migration/neon-20261128T072421Z/`. PostgreSQL 18 tools bundled with the user's current pgAdmin were used because Neon runs PostgreSQL 18.

The import used `pg_restore --single-transaction --exit-on-error --clean --if-exists --no-owner --no-acl` on a dump restricted to `public`. It preserved the managed `neon_auth` schema. Every original table matched by row count and a SHA-256 hash of every row after normalizing the session timezone to UTC. Evidence: `.private/database-migration/neon-verification.json`.

Before applying the new authentication migration, both databases contained 23 application tables, four users, 106 patients, 103 prescriptions, 115 stock batches and 102 dispensing transactions. Migration `0006_authratelimit_neonidentity` then added the local identity bridge and shared linking counters to Neon. The original local database was retained. Its environment configuration is backed up in `.private/local-before-neon.env`; the current ignored `.env` points to Neon.

`scripts/db_migrate.py` supports `inspect`, `copy` and `verify`. The default copy refuses a populated target. `--replace-public` is an explicit destructive option, backs up the old target first and restores within one transaction. `PG_BIN` can select a directory with compatible PostgreSQL client tools. Pause source writes during a real cutover; the script checks for source changes during its copy. Never rerun this initial import as part of ordinary code deployment.

## Verification

Automated backend checks cover real signed JWT validation, wrong issuer/audience/expiry/signature, malformed identifiers, email verification, bans, session revocation, CSRF, privilege boundaries, profile validation, legacy linking and shared link rate limits. Frontend checks cover signup gating, OTP verification, resend cooldown/provider errors, recovery, password confirmation, remember-me and first-login setup.

Live Neon testing on 2026-11-28 confirmed delivered verification and reset emails (codes supplied by the user), successful verification/sign-in/session restoration, JWT issuance, the Django API bridge, CSRF-protected writes, Patient access limits, provider logout with immediate API rejection, password reset, rejection of the old password and revocation of existing sessions. The fictional profiles used for the live API tests were rolled back. Evidence is in ignored `.private/live-auth-verification.json`; temporary test credentials/session values were removed after verification. The verified test identity remains unlinked so the user can link the appropriate existing pharmacy account.

Live Google sign-in was also completed with the user's explicit approval: account selection, consent, callback, verified identity recognition and session restoration after a browser reload all succeeded. The user is left at account linking/profile completion rather than being assigned an existing pharmacy role automatically. Shared development credentials and email limits still need replacing before public production use. This work does not deploy or push code to Azure/GitHub.

Final checks: 70 backend tests plus 26 subtests passed in the isolated PostgreSQL test cluster; 15 frontend tests passed; the production frontend build passed; API schema validation passed with `--validate --fail-on-warn` in both local and Neon modes. After the final public branch-selection change, the targeted branch/auth suite also passed (17 tests plus 5 subtests), followed by the final 8 auth tests. The build still reports the existing large-bundle advisory, and npm reports a moderate advisory in the existing i18next dependency; no new Neon SDK advisories remain in the installed dependency audit.

References: [Neon authentication flow](https://neon.com/docs/auth/authentication-flow), [JWT verification](https://neon.com/docs/auth/guides/plugins/jwt), [email OTP](https://neon.com/docs/auth/guides/plugins/email-otp), [production configuration](https://neon.com/docs/auth/production-checklist).
