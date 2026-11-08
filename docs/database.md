# Domain database — phase 2 of 9

PostgreSQL is authoritative. Schema: `backend/pharmacy/models.py`; executable migration: `backend/pharmacy/migrations/0001_initial.py`. The original `DB/SQLite.db` remains unchanged and is not imported automatically.

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

## Rules implemented in this phase

- Stock cannot be negative; prices and prescribed/dispensed quantities must be positive.
- Batch expiry must follow its receipt date. Prescription validity must end on or after its issue date.
- Prescription status is restricted in PostgreSQL to active, completed, or cancelled.
- Referenced business records use Django PROTECT deletion behavior. The patient/user link uses SET_NULL to preserve domain records after account deletion.
- Model validation rejects future birth dates, prescription medication/batch mismatches, patient mismatches, and Rx dispensing without a prescription. Call `full_clean()` in application write paths: Django `save()` does not do this automatically.
- OTC dispensing can omit a prescription line. Patient identity is still required in this MVP.
- Quantities are whole dispensing units (tablets, bottles, etc.), not an implicit mixture of packs and individual doses. Prices are per unit in KZT with two decimal places.
- There is one line per medication per prescription; directions describe the regimen. Refills and repeat prescriptions are outside the current model.

## Upcoming transactional dispensing rules

The future dispensing service must execute validation and writes in one database transaction, lock the batch and prescription line, reject inactive/expired/future-issued prescriptions and expired/inactive medication, cap cumulative dispensing at the prescribed quantity, decrement stock, and preserve the transaction price. Partial dispensing is supported by multiple transactions referencing the same line. It must update completed prescription status when all lines are fulfilled.

These cross-record and concurrency rules are not enforced by this schema alone. No dispensing API is exposed yet. Direct ORM writes must not be treated as a safe dispensing workflow. Allergy notes are documentation, not an automated clinical decision engine.

## Reproduce

With the local Docker services configured as described in the README:

```text
docker compose up --build -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py seed_demo
docker compose exec backend python -m pytest -p no:cacheprovider
```

`seed_demo` is atomic and repeatable: it creates missing fictional records without resetting existing stock, changing prescriptions, or creating login credentials. Dates are relative to the first run and are not extended on rerun. It does not insert dispensing events because those must go through the later transactional workflow.

Authentication will use Django's existing User model and Groups (Admin, Pharmacist, Patient), with the optional patient profile relationship. This avoids replacing the auth schema already migrated in Phase 0.
