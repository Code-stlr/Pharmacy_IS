# Application guide

## Run and sign in

Start the stack following the root README, then run `docker compose exec backend python manage.py seed_demo`.

To create the shared fictional accounts on localhost, run:

```powershell
docker compose exec backend python manage.py create_demo_users --shared-demo
```

The command creates missing accounts with the public team demo password `Demo-Pharmacy-2026!`. Run the seed command first so the new patient account can link to the fictional `DEMO-P001` patient. Existing accounts keep their passwords and roles. Public registration creates Patient accounts only. Use the admin panel to assign a pharmacist to an active branch.

To choose a custom password for newly created demo accounts, pass `DEMO_PASSWORD` to the command without `--shared-demo`. Open http://localhost:8081.

## Role behavior

- Admin and Pharmacist: find and serve patients across branches, maintain shared catalogs and clinical records, and receive or dispense stock at the current branch. Pharmacists sign in directly to their assigned branch. Administrators can switch active branches without signing out.
- Patient: view their own patient record, prescriptions and dispensing history across all branches, and edit their account name, email and phone. A branch selected at registration is a preference. Staff manage clinical identity and allergies.
- Anonymous or unassigned users cannot access domain records. Superusers are treated as Admin.

The frontend hides staff actions for patients. The API independently applies role checks and ownership filters. Admins also have `/admin` for user and reference-record management. There is no deletion API for clinical history and no stock edit API. Batch corrections, returns and cancellations remain later work.

## Admin panel

Sign in as `admin_demo` and select Admin panel. Use **Branches** to create or update a location and the workspace switcher to choose which location’s stock you are working with. Use **Users** to create a pharmacist with an active branch assignment. Users and shared reference records support search, creation, editing and confirmed deletion of eligible records. Passwords are required when creating users and optional when editing. Role assignment is restricted to administrators.

To give an existing patient portal access, create a Patient account under **Users** and select the existing patient record. Public registration creates a new patient record. Before creating a patient record at a branch, search the shared directory for the existing patient reference.

The separate `/api/admin/{users,medications,categories,suppliers,doctors,patients}/` endpoints support GET, POST, PATCH and DELETE. They independently reject non-admin access. Linked clinical records cannot be deleted. Superusers and the current administrator are protected from destructive account changes; serialized account administration preserves an active administrator. Deactivate eligible linked accounts instead of erasing history. No admin endpoint deletes prescriptions, batches or dispensing transactions.

The workspace has an overview with real scoped counts, inventory availability and recent dispensing, sidebar navigation, mobile navigation, searchable ledgers and dialog forms.

## Demonstrate the main workflow

1. Sign in as `pharmacist_demo`.
2. Find or create a fictional patient in Patients.
3. Create a prescription with a reference, doctor, validity dates, and one or more medication lines.
4. Open Dispense and choose the same patient, a valid matching batch, the prescription line, and a quantity no greater than its remaining allowance or stock.
5. Confirm the operation. Check Inventory batches for reduced stock and Dispensing history for the recorded operation.
6. Dispense the remaining authorized quantity. The prescription becomes Completed once every line is supplied.
7. Attempt an excessive quantity or wrong batch to show a rejected operation with unchanged stock.
8. Sign in as `patient_demo` to demonstrate limited visibility.
9. Switch between English, Kazakh and Russian. Search patients, medications and prescriptions.

Use a medication marked as not requiring a prescription for OTC dispensing; leave the prescription-line field empty. All dispensing still requires a patient record in this MVP.

## Demonstrate a cross-branch prescription fill

1. In the admin panel, create a second branch and assign it a pharmacist. Switch to that branch and receive a batch of the same medication as a batch held at Main Branch.
2. At Main Branch, record a fictional patient allergy and dispense part of a prescription. Use an allergy entry unrelated to the medication for this successful-fill scenario.
3. Sign in as the second branch’s pharmacist. Find the same patient by reference in **Patients** and open their history. Confirm the allergy, first fill location and remaining prescription quantity.
4. Complete the prescription using the second branch’s batch. The remaining quantity is zero, each location’s stock reflects its own fill, and the patient’s portal shows both locations in one history.

## API

API clients first GET `/api/auth/csrf/` and send the returned token as `X-CSRFToken` on unsafe requests, keeping the session and CSRF cookies. Login and registration enforce CSRF for anonymous clients too. Cookies stay on the same origin; Nginx preserves the original Host including the port. No JWT or local-storage credential storage is used.

| Endpoint | Operations |
|---|---|
| `/api/auth/login/`, `/api/auth/register/`, `/api/auth/logout/` | POST |
| `/api/auth/me/` | GET, PATCH account name/email |
| `/api/auth/branch/` | POST an active branch ID as `{"branch": id}` with an administrator session |
| `/api/auth/patient/` | GET own linked record, PATCH own phone |
| `/api/branches/` | Public GET active branch names and identifiers |
| `/api/admin/branches/` | Administrator GET, POST and PATCH |
| `/api/patients/`, `/api/medications/`, `/api/categories/`, `/api/suppliers/`, `/api/doctors/` | GET, POST, PATCH detail |
| `/api/batches/`, `/api/prescriptions/` | GET, POST; immutable through this API after creation |
| `/api/dispensings/` | GET, POST transactional dispensing |
| `/api/schema/`, `/api/docs/` | Authenticated OpenAPI schema and Swagger UI |
| `/api/health/` | Public GET readiness without database details |

Search uses `?search=...`. Look up a patient by exact `?reference=...` and filter prescriptions or dispensing history with `?patient=<id>`. Login and account responses include `active_branch`. The workspace sends `X-Pharmacy-Branch` with the branch displayed in that tab, and the API validates it against the account’s branch privileges. Passwords use Django hashing and validation. Anonymous login/registration requests are throttled to 10 per minute per IP using the configured process-local cache. Distributed throttling, TLS and deployment hardening belong to VPS deployment.

## Localization

`frontend/src/locales.ts` contains parallel dictionaries for all application-owned labels, notices, state messages and validation summaries. Resource data, names and free-text directions are stored as entered. Language preference is persisted locally. Backend rule failures return stable codes that the UI translates; raw backend validation messages are not rendered. Native browser validation remains browser-controlled. Fluent-speaker review of Kazakh/Russian is still required.

## Verification

```text
docker compose exec backend python -m pytest -p no:cacheprovider
docker compose exec backend python manage.py spectacular --validate --fail-on-warn --file /tmp/schema.yml
```

From `frontend/`, run `npm test`, `npm run build`, and `npx playwright install chromium`. Set `DEMO_PASSWORD` to the local demo password and run `npx playwright test` against the running app. Browser tests create fictional records and consume a few demo stock units; seeds intentionally do not reset them.

The application currently loads complete small resource lists for dropdowns and search screens. Pagination, large-data optimization, clinical allergy/interaction checking, idempotent retries and production operations remain future work. Submit dispensing once and verify history before retrying an uncertain network result.

## Development without container rebuilds

Use Python 3.14, Node 24 and a running PostgreSQL instance. Set the variables from `.env.example` in your shell, including `POSTGRES_HOST` for your database. Django does not automatically load `.env` outside Compose.

From the repository root:

```powershell
python -m venv .venv
./.venv/Scripts/python -m pip install -r backend/requirements.txt
cd backend
../.venv/Scripts/python manage.py migrate
../.venv/Scripts/python manage.py runserver
```

In another terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Vite proxies `/api` to Django. Tests and migrations require PostgreSQL; the health unit tests alone do not prove database availability.
