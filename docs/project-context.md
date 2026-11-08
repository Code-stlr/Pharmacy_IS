# Current project context

Read `project-plan.md` for approved scope, architecture, course criteria, and ownership. Root course documents remain governing references.

## Implemented

- Phase 0 application scaffold with a React/TypeScript frontend and Django API.
- Material UI, routing shell, and translations for the existing screen in English, Kazakh, and Russian.
- PostgreSQL configuration and an API readiness check.
- Local Docker Compose topology with an Nginx frontend proxy.
- Frontend and backend foundation tests.

## Next implementation phase

Design and test the domain models before implementing authentication and dispensing. Decide prescription line quantities, partial dispensing, batch expiry rules, OTC handling, and stock transaction invariants. Preserve `DB/SQLite.db` unchanged as reference. Add a custom user model before creating application migrations to avoid a later auth migration rewrite.

## Constraints

- Educational MVP; fictional data only.
- Do not treat the scaffold as completed Week 1–10 functionality.
- Preserve actual completion dates and individual contribution evidence.
- Never push without Ehsan's explicit approval.
- Update this context and `docs/progress/` after each completed part.
