# Week 10 — progress record

Recorded: 2026-11-08. This records work completed at the end of Week 10, including catch-up against earlier criteria.

## Planned

Approve the project architecture and establish an executable foundation.

## Completed

- Approved the project scope, stack, ownership, definition of done, and Git workflow.
- Preserved the SQLite prototype at its original path, SHA-256 `3B29DE2E27319E161B8222945CF5986839C383CD44D6CDD8DEDBC149DE9F9301`.
- Added the frontend/backend scaffold, local deployment configuration, and foundation tests.

## Contribution and AI use

Ehsan Bali directed requirements and architecture decisions. Codex generated the scaffold, configuration, translations, tests, and documentation under his direction. Other members' implementation contributions are not yet evidenced in this checkout. Translation review by fluent speakers remains pending.

## Evidence

- Approved plan commit: `91336c2`.
- Foundation branch: `ehsan/foundation`; use its foundation commit for implementation evidence.
- Source: `backend/`, `frontend/`, `docker-compose.yml`, and `README.md`.

## Risks and deferred work

Domain features, auth, RBAC, search, full application localization, diagrams, course analysis, and deployment are pending. Foundation localization alone does not complete Week 10. Verification outcomes are recorded below after checks finish.

## Next week

- Garifolla: corrected domain models, constraints, migrations, seeds, and ERD.
- Baiyrov: session authentication, CSRF, role authorization, API contracts.
- Damir: patient/inventory forms and dispensing screens against agreed contracts.
- Daulet: workflow acceptance tests, integration checks, and defect evidence.
- Ehsan: requirements acceptance criteria, UML, analysis artifacts, and updated weekly report.

Each task needs a reviewed commit and demonstrable evidence before it is marked complete.

## Verification results

- Django system check: passed.
- Backend: 3 tests passed locally and inside the Linux container.
- Frontend: 2 tests passed, covering language switching, readiness, failure, and retry.
- TypeScript and production frontend build: passed.
- npm dependency audit after test-tool update: zero reported vulnerabilities.
- Compose configuration and both container builds: passed.
- Live Nginx page: HTTP 200 at `http://localhost:8080`.
- Live Django/PostgreSQL readiness: `GET /api/health/` returned `{"status":"ok"}`.
- Original SQLite SHA-256 remains unchanged.

Local verification used `.env.example` through `PHARMACY_ENV_FILE`; replace its example secrets for normal use. Containers are bound to localhost. There was no browser visual inspection. The build reports a 532 KB JavaScript chunk, and container pytest reports a harmless unwritable cache directory warning. Neither prevented verification.

## Domain milestone — phase 2 of 9

Completed 2026-11-08 on branch `ehsan/domain-models` under Ehsan's direction with Codex assistance. This is AI-assisted implementation under Ehsan's Git identity, not evidence of another member's authorship.

- Added nine domain models and a reversible initial migration to PostgreSQL.
- Added FK relationships, protected historical references, unique constraints, and price/quantity/date/status checks.
- Added prescription lines and optional prescription linkage for OTC dispensing.
- Added model validation for wrong patient/medication relationships and future birth dates.
- Added atomic, repeatable fictional demo seeding; reruns preserve stock and records.
- Added `docs/database.md` and Mermaid ERD source in `docs/diagrams/domain-erd.md`.
- Kept the original SQLite prototype unchanged.
- Ignored and untracked `Taks/` at Ehsan's request; local assignment files remain present. Existing Git history retains earlier versions.

Verification: 17 backend tests passed against PostgreSQL, including fresh test-database migration, DB constraints, model validation, protected deletion, and repeatable seeds. Django system check passed and `makemigrations --check --dry-run` detected no missing migrations. Seeding twice in the running application succeeded; the live health endpoint remained healthy. Frontend container build passed during integration.

The test filename configuration was expanded to discover Django-style `tests.py` as well as `test_*.py`. Authentication and transactional dispensing remain next. An exported ERD image and browser-based database screens are not implemented in this milestone.
