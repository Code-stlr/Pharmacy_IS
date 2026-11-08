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

Total: **43 tests**, plus 3 backend subtests. This count excludes migration/schema/build checks.

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

- Vite reports a 557 KB JavaScript chunk before gzip. The build succeeds; code splitting is a later performance improvement.
- No VPS, TLS, backup restore, load test, penetration test or complete clinical safety audit was performed.
- Dedicated Week 11 admin CRUD is still pending. Automated checks cannot close that requirement.
- Translation review by fluent speakers, instructor topic approval, each student's personal review and the actual group rehearsal remain human actions.
- Browser tests create fictional records and consume small stock quantities in the acceptance database. Seeds intentionally do not reset them.

## Demonstration readiness

The tested local workflow is ready for a technical demonstration using demo-runbook.md. Team readiness remains conditional on the personal review/rehearsal and approval items listed above. Screenshots in `screenshots/` are fictional acceptance-run evidence.
