# PostgreSQL database

PostgreSQL is the application database. Schema: `backend/pharmacy/models.py`; executable migrations: `backend/pharmacy/migrations/`. Develop the schema through versioned Django migrations.

## Use Windows PostgreSQL with the Docker app

The default Compose stack runs PostgreSQL in Docker. To use a database running on the Windows host, start PostgreSQL first, create an app-owned database, and set its name, username and password in the local `.env`. The app containers connect through `host.docker.internal` by default. Set `PHARMACY_EXTERNAL_DB_HOST` or `PHARMACY_EXTERNAL_DB_PORT` in `.env` if needed.

```powershell
docker compose -f docker-compose.yml -f docker-compose.external-db.yml up --build -d --wait
curl.exe --fail http://localhost:8081/api/health/
```

For subsequent plain `docker compose` commands on Windows, set `COMPOSE_FILE=docker-compose.yml;docker-compose.external-db.yml` in `.env`. The override disables the bundled database service unless its profile is explicitly selected. The backend applies pending Django migrations to the configured database at startup.

When replacing an existing database, first save a private `pg_dump` and test its restore to a separate database. Restore the intended snapshot into an empty database. Confirm that Django applies `pharmacy.0002_allergy` if the snapshot predates the allergy catalog, then load any catalog data you need to carry over. Verify the health endpoint, an authenticated workflow and representative record counts before removing the old database. Keep raw dumps outside Git because they can contain patient data and password hashes.

## Entities and keys

All models have an automatically generated bigint `id` primary key. Foreign keys are indexed by Django. Unique keys cover patient/prescription/dispensing references, doctor licenses, supplier/category names, medication presentations, and medication/lot pairs.

| Entity | Purpose and relationships |
|---|---|
| Category | One category has many medications |
| Medication | Ingredient, strength, dosage form, dispensing unit, Rx requirement |
| Supplier | One supplier supplies many batches |
| DrugBatch | Medication and supplier FKs; receipt/expiry dates, current stock and unit price |
| Patient | Fictional demographics, allergy notes, optional unique user FK |
| Doctor | Prescriber with unique license identifier |
| Prescription | Patient and doctor FKs, reference, issue/expiry dates, status |
| PrescriptionLine | Prescription and medication FKs, authorized quantity, directions |
| DispensingTransaction | Patient, pharmacist user and batch FKs; optional prescription-line FK; quantity, price snapshot, timestamp |

See [ERD](diagrams/domain-erd.md).

## Data rules

- Stock cannot be negative; prices and prescribed/dispensed quantities must be positive.
- Batch expiry must follow its receipt date. Prescription validity must end on or after its issue date.
- Prescription status is restricted in PostgreSQL to active, completed, or cancelled.
- Referenced business records use Django PROTECT deletion behavior. The patient/user link uses SET_NULL to preserve domain records after account deletion.
- Model validation rejects future birth dates, prescription medication/batch mismatches, patient mismatches, and Rx dispensing without a prescription. Call `full_clean()` in application write paths: Django `save()` does not do this automatically.
- OTC dispensing can omit a prescription line. Patient identity is still required in this MVP.
- Quantities are whole dispensing units (tablets, bottles, etc.), not an implicit mixture of packs and individual doses. Prices are per unit in KZT with two decimal places.
- There is one line per medication per prescription; directions describe the regimen. Refills and repeat prescriptions are outside the current model.

## Transactional dispensing rules

`backend/pharmacy/services.py` executes validation and writes in one database transaction, locks the prescription, line and batch, rejects inactive/expired/future-issued prescriptions and expired/inactive medication, caps cumulative dispensing at the prescribed quantity, decrements stock, and preserves the transaction price. Partial dispensing is supported by multiple transactions referencing the same line. Prescription status becomes completed when all lines are fulfilled. A batch expiring today is considered unavailable; batches not yet received are also rejected.

These cross-record and concurrency rules are enforced by the dispensing service, not by the schema alone. `POST /api/dispensings/` uses that service and requires Admin or Pharmacist membership. Stock cannot be edited through the API after a batch is created, and transactions cannot be changed or deleted. Direct ORM writes must not be treated as a safe dispensing workflow. Allergy notes remain documentation, not an automated clinical decision engine.

## Reproduce

With the local Docker services configured as described in the README:

```text
docker compose up --build -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo
docker compose exec backend python -m pytest -p no:cacheprovider
```

`seed_demo` is atomic and repeatable. The default seed creates a small set of fictional records for acceptance tests. Run `seed_demo --full` for a fresh demo database with 104 patients, 103 prescriptions, 102 dispensing events, 27 medications, 106 stock batches, and five allergy catalog entries. The full seed uses the normal dispensing workflow and an inactive, unusable history account. Dates are relative to the first run. Re-running the command preserves existing records, stock, and passwords. Use `create_demo_users` with a local `DEMO_PASSWORD` to create sign-in accounts.

Authentication uses Django's User model and Groups (Admin, Pharmacist, Patient), with an optional patient profile relationship. The admin API also prevents deletion of linked patient accounts and protects the current administrator and superusers.
