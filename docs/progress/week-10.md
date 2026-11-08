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
