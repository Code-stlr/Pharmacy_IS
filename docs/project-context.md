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

Phases 3–6 now provide session authentication, patient registration, Admin/Pharmacist/Patient authorization, scoped patient data, account profile editing, transactional Rx/OTC dispensing, resource forms, history, multi-entity search, and complete UI dictionaries for English/Kazakh/Russian. See `application.md` for endpoints, operation and limitations. Django's existing User and Groups remain authoritative for roles.

Next is phase 7: course evidence and presentation artifacts, followed by the broader phase 8 verification milestone and phase 9 VPS deployment. The dedicated Week 11 admin dashboard is still pending. Existing tests provide implementation evidence but do not replace a full acceptance review.

## Constraints

- Educational MVP; fictional data only.
- Do not treat the scaffold as completed Week 1–10 functionality.
- Preserve actual completion dates and individual contribution evidence.
- Never push without Ehsan's explicit approval.
- Update this context and `docs/progress/` after each completed part.
