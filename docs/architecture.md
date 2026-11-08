# Architecture and design decisions

React/TypeScript/Vite and Material UI provide the interface. Django REST Framework provides same-origin JSON endpoints. Nginx serves the built frontend and proxies /api to Gunicorn/Django. PostgreSQL stores domain records, auth sessions, groups and hashed passwords. Docker Compose runs the local topology.

## Boundaries

- Frontend: src/App.tsx orchestrates the small MVP screens; resources.ts describes forms; api.ts attaches CSRF; locales.ts owns translations.
- Backend: auth.py owns registration/sessions/profile; api.py owns role checks and scoped querysets; admin_api.py owns administrator CRUD and deletion/account safeguards; serializers.py validates records; services.py owns atomic dispensing.
- Database: models.py and versioned migrations own schema and constraints.
- Tests: backend tests use real PostgreSQL, frontend unit tests verify UI state/dictionary parity, Playwright exercises the full HTTP path.

## Decisions

- Keep React and Django separate for team ownership and a richer interface, accepting API integration work.
- Keep a single domain app while the MVP is small. Split it when concrete ownership or complexity warrants it.
- Use PostgreSQL row locks rather than application-only stock checks. Prescription-first locking serializes completion across lines.
- Keep Django User and Groups. Patient links to User optionally. This preserves the already-migrated auth schema.
- Use session cookies and CSRF on the same origin. Never store passwords/session tokens in localStorage.
- Keep batches, prescriptions and dispensing history immutable through this MVP API after creation. Correction and cancellation workflows need a separate reviewed design.
- PostgreSQL and reviewed Django migrations are the application data source. Demo seeds use fictional records.

## Deployment boundary

The current Compose file binds only localhost and uses local settings. TLS, secret rotation, backups, distributed rate limiting and production deployment checks remain deployment work. The API currently loads small complete lists; pagination is future scaling work.
