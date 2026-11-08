# Current project context

Read `project-plan.md` for approved scope, architecture, course criteria, and ownership. Root course documents remain governing references.

## Implemented

- Phase 0 application scaffold with a React/TypeScript frontend and Django API.
- Material UI, routing shell, and translations for the existing screen in English, Kazakh, and Russian.
- PostgreSQL configuration and an API readiness check.
- Local Docker Compose topology with an Nginx frontend proxy.
- Frontend and backend foundation tests.
- Domain phase (phase 2 of the nine-item roadmap): nine pharmacy models, PostgreSQL constraints, initial migration, repeatable fictional demo seeds, ERD, and domain tests. See `database.md`.

## Next implementation phase

Implement authentication and role permissions using Django's existing User and Groups. Patient has an optional one-to-one user link. Preserve the existing auth schema; no custom user replacement or database reset is needed. Domain decisions and future dispensing invariants are documented in `database.md`. After security, implement the atomic dispensing service and application screens.

## Constraints

- Educational MVP; fictional data only.
- Do not treat the scaffold as completed Week 1–10 functionality.
- Preserve actual completion dates and individual contribution evidence.
- Never push without Ehsan's explicit approval.
- Update this context and `docs/progress/` after each completed part.
