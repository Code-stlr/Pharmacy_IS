# Phase 8 technical acceptance report

Run date: 2026-11-08, Asia/Qyzylorda. Result: **PASS for the defined local educational-MVP acceptance scope**. This is a technical result, not instructor acceptance, clinical certification or proof of a group rehearsal.

## Reproduction and environment

Run `scripts/verify.ps1` from PowerShell with `DEMO_PASSWORD` set to a strong demo password. Requires Docker Desktop/Linux containers, Compose 2.24.4+, Node 24, and installed Playwright Chromium (`cd frontend; npx playwright install chromium`). The script uses `.env.example` only for its isolated loopback demonstration, not production credentials.

The verification used the separate `pharmacy-acceptance` Compose project, new PostgreSQL volume on its first run, and port 8181. The existing application on port 8080 and its database were preserved. Schema migration, seed data and demo-account provisioning succeeded. Later reruns preserved the same acceptance data while validating fixes. The final script returned exit code 0. The acceptance stack remains available at http://localhost:8181.

## Results

| Check | Result | Evidence |
|---|---|---|
| Django configuration | PASS | manage.py check: no issues |
| Migration drift | PASS | makemigrations --check --dry-run: no changes |
| Backend/PostgreSQL | PASS | 33 tests plus 3 subtests |
| API documentation | PASS | spectacular --validate --fail-on-warn completed without warnings |
| Fictional seeds/accounts | PASS | Repeated commands preserve records and existing accounts |
| API readiness | PASS | /api/health/ returned status ok |
| Frontend | PASS | 4 Vitest tests |
| Production frontend | PASS | TypeScript and Vite build succeeded |
| Browser acceptance | PASS | All 6 Playwright scenarios below |
| Frontend dependency audit | PASS | npm install/ci reported zero vulnerabilities |
| Artifact review | PASS | All 12 slide previews, exported UML/ERD and 3 wireframes inspected |
| SQLite preservation | PASS | SHA-256 unchanged: 3B29DE2E27319E161B8222945CF5986839C383CD44D6CDD8DEDBC149DE9F9301 |

Baseline total: **43 tests**, plus 3 backend subtests. This count excludes migration/schema/build checks. The subsequent Week 11 result below supersedes this count.

## Browser scenarios

1. Login screen accessibility scan and keyboard movement from username to password.
2. Local authenticated search with all browser requests to public hosts blocked, an empty search result, 390px layout without horizontal overflow, and an accessibility scan.
3. Incorrect credentials remain unauthenticated; error switches to Russian; simulated network failure displays its translated message.
4. Staff creates a patient and prescription, dispenses the authorized quantity and observes Completed status.
5. Patient registration, profile update, restricted navigation, all three languages and logout.
6. Medication search, confirmed OTC dispensing, persistent stock decrement and mobile history display.

The accessibility scans found no serious or critical WCAG 2 A/AA violations on the tested login and medication-search states. This is not a full WCAG conformance audit. Public-host blocking simulates internet unavailability for browser requests while retaining loopback access; the physical network adapter was not disconnected, and dependency downloads/builds still require initial internet access.

## Defects found and corrected

- DEF-001: floating language label lacked contrast against the teal app bar. Replaced it with a visible high-contrast label.
- DEF-002: the initial replacement placed ARIA text on a roleless wrapper. Linked the actual select to its visible label using MUI labelId. Repeated keyboard/accessibility/browser checks pass.

## Remaining limitations

- Vite reported a 557 KB JavaScript chunk at baseline, approximately 599 KB after the Week 11 redesign. The build succeeds; code splitting is a later performance improvement.
- No VPS, TLS, backup restore, load test, penetration test or complete clinical safety audit was performed.
- Dedicated Week 11 admin CRUD was subsequently completed and tested as recorded below.
- Translation review by fluent speakers, instructor topic approval, each student's personal review and the actual group rehearsal remain human actions.
- Browser tests create fictional records and consume small stock quantities in the acceptance database. Seeds intentionally do not reset them.

## Demonstration readiness

The tested local workflow is ready for a technical demonstration using demo-runbook.md. Team readiness remains conditional on the personal review/rehearsal and approval items listed above. Screenshots in `screenshots/` are fictional acceptance-run evidence.

## Week 11 extension — 2026-11-08

The complete `scripts/verify.ps1` run returned exit code 0 after the frontend redesign and admin implementation: **40 backend tests plus 21 subtests, 4 frontend tests and 8 Playwright scenarios: 52 tests total**. Django configuration, migration drift, OpenAPI validation, readiness and production TypeScript/Vite build also passed. No schema migration was required. The original SQLite database remained unchanged.

Two additional browser scenarios verify user creation/editing/deletion, cancelling deletion, category CRUD, rejection of referenced-category deletion, all three admin UI languages, administrator accessibility, mobile navigation/Escape and pharmacist denial at both `/admin` and the admin API. Backend tests also exercise every admin resource's denied GET/POST/PATCH/DELETE access, weak passwords, self/superuser protection, linked-account protection and medication deletion rules.

The isolated acceptance backend overrides `AUTH_ANON_RATE` to `1000/min` because repeated browser logins share one loopback IP. Normal local/production configuration retains `10/min`; the override exists only in `docker-compose.acceptance.yml`. Accessibility scans passed without serious/critical violations on the tested login, medication-search and admin states after entrance animation settled. This remains a scoped check, not a complete accessibility audit.

Final desktop (1440×1000) and mobile (390×844) captures report loaded fonts, no page errors and no horizontal overflow. See `week11-design-review.md` and `week11/screenshots/`. Presentation files were left unchanged.
