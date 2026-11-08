# Application guide

## Run and sign in

Start the stack following the root README, then run `docker compose exec backend python manage.py seed_demo`.

To create fictional accounts, choose a strong demo-only password and run:

```powershell
docker compose exec -e DEMO_PASSWORD="your-demo-password" backend python manage.py create_demo_users
```

The command creates `admin_demo`, `pharmacist_demo`, and `patient_demo` only if missing. It never resets existing passwords or changes existing roles. Run the seed command first so the new patient account can link to the fictional `DEMO-P001` patient. Public registration creates Patient accounts only. Roles can be provisioned by trusted operators through Django Groups; there is no public role assignment endpoint.

Use the password you supplied when creating these local accounts. Existing account passwords are never reset by provisioning. Open http://localhost:8080.

## Role behavior

- Admin and Pharmacist: view, search, create and edit patients, categories, suppliers, doctors and medications; receive new batches; create prescriptions; dispense medication; view history.
- Patient: view only their linked patient record, prescriptions and dispensing history; edit their own account name/email. Their phone can also be updated through `/api/auth/patient/`. Clinical identity and allergy notes are staff-managed.
- Anonymous or unassigned users cannot access domain records. Superusers are treated as Admin.

The frontend hides staff actions for patients. The API independently applies role checks and ownership filters. Admins also have `/admin` for user and reference-record management. There is no deletion API for clinical history and no stock edit API. Batch corrections, returns and cancellations remain later work.

## Admin panel

Sign in as `admin_demo` and select Admin panel. Users, Medications, Categories, Suppliers, Doctors and Patients support search, creation, editing and confirmed deletion of eligible records. Passwords are required when creating users and optional when editing; stored passwords use Django hashing. Role assignment is restricted to administrators.

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

## API

API clients first GET `/api/auth/csrf/` and send the returned token as `X-CSRFToken` on unsafe requests, keeping the session and CSRF cookies. Login and registration enforce CSRF for anonymous clients too. Cookies stay on the same origin; Nginx preserves the original Host including the port. No JWT or local-storage credential storage is used.

| Endpoint | Operations |
|---|---|
| `/api/auth/login/`, `/api/auth/register/`, `/api/auth/logout/` | POST |
| `/api/auth/me/` | GET, PATCH account name/email |
| `/api/auth/patient/` | GET own linked record, PATCH own phone |
| `/api/patients/`, `/api/medications/`, `/api/categories/`, `/api/suppliers/`, `/api/doctors/` | GET, POST, PATCH detail |
| `/api/batches/`, `/api/prescriptions/` | GET, POST; immutable through this API after creation |
| `/api/dispensings/` | GET, POST transactional dispensing |
| `/api/schema/`, `/api/docs/` | Authenticated OpenAPI schema and Swagger UI |
| `/api/health/` | Public GET readiness without database details |

Search uses `?search=...`. Passwords use Django hashing and validation. Anonymous login/registration requests are throttled to 10 per minute per IP using the configured process-local cache. Distributed throttling, TLS and deployment hardening belong to VPS deployment.

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
