# Public demo staff accounts

These accounts are deliberately documented for the university demo and may be committed to GitHub. Employee names and IDs are fictional. Use fictional training data only: the credentials below are public, including the administrator password.

All nine accounts use this **initial password**:

```text
Demo-Pharmacy-2026!
```

| Login ID | Display name | Role | Assigned branch |
|---|---|---|---|
| `admin@toppharmacy.com` | Demo Admin | Admin | All branches |
| `aidaemp001_main@toppharmacy.com` | Aida | Pharmacist | Main Branch — MEGA Alma-Ata |
| `timuremp002_main@toppharmacy.com` | Timur | Pharmacist | Main Branch — MEGA Alma-Ata |
| `daniyaremp003_tolebi@toppharmacy.com` | Daniyar | Pharmacist | Branch Tole-Bi |
| `madinaemp004_tolebi@toppharmacy.com` | Madina | Pharmacist | Branch Tole-Bi |
| `armanemp005_tastak@toppharmacy.com` | Arman | Pharmacist | Branch Tastak |
| `aliyaemp006_tastak@toppharmacy.com` | Aliya | Pharmacist | Branch Tastak |
| `diasemp007_dostyq@toppharmacy.com` | Dias | Pharmacist | Branch Dostyq — Dostyk Plaza |
| `saraemp008_dostyq@toppharmacy.com` | Sara | Pharmacist | Branch Dostyq — Dostyk Plaza |

The pharmacist format is `<name>emp<employee-number>_<branch>@toppharmacy.com`. These addresses are **login IDs**, not real mailboxes created by this project. They do not require personal Gmail accounts, Google sign-in, signup verification emails, or account linking.

## Sign in

Open the normal **Sign in** page, enter a login ID in the Email field and use the initial password above. The account's role and branch are already configured. The admin can choose an active branch; each pharmacist's inventory access is restricted to their assigned branch. Shared patient records remain available across branches according to the existing pharmacy permissions.

## Change a password

After signing in, open **My profile → Change password**. Enter the current password, the new password and its confirmation. No email is needed. Other sessions for that account are signed out.

The documented password is the initial password only. If someone changes it, the new password takes effect and the seed command does not reset it. Because these IDs have no project-managed mailboxes, email-based forgot-password delivery is not a usable recovery method for staff. An authorized operator must recover a forgotten staff password through managed Auth administration. Patients continue to use real-email verification and recovery.

## Reproduce the demo setup

With the intended Neon environment loaded, Node installed, frontend dependencies installed (`npm ci`), and the four configured branches present, run from `backend`:

```powershell
python manage.py provision_demo_staff --shared-demo
```

This is an operator-only demo bootstrap, not a public signup endpoint. It writes the inspected managed Better Auth user/account schema and pharmacy identity mappings in one database transaction. Passwords are independently salted using the installed Better Auth password implementation, never stored in plaintext in the database. The accounts receive pharmacy Admin/Pharmacist roles; none receives Neon Auth administration privileges.

The command refuses identity conflicts and missing/inactive branches, preserves existing account IDs/passwords/branch assignments, and does not alter patient records or inventory. Back up the database before running it on another branch and review compatibility if the managed Auth schema or SDK changes. Existing legacy demo accounts remain untouched.

## Verification on 2026-11-28

All nine live Neon logins were tested against the application: the admin received Admin access; every pharmacist received the correct branch and was denied admin access. A browser check also confirmed direct pharmacist sign-in and the password-change dialog. Live password-change testing confirmed current-password validation, old-password rejection and revocation of other sessions; the initial demo password was restored afterward.

The full backend suite passed 79 tests plus 26 subtests. The frontend passed 28 tests and its production build, including regressions for session restoration after branch switching and loading records without displaying a false empty state. The live Categories API and browser both showed all 11 migrated records. No Azure code deployment was performed as part of this change.
