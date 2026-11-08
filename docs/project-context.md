# Current project context

Read `project-plan.md` for approved scope, architecture, course criteria, and ownership. Root course documents remain governing references.

Read [task-register.md](task-register.md) for current task status, stable area owners, proposed member assignments, remaining semester requirements and completion evidence. Update it alongside the weekly record after every completed part. Optional product ideas are separate from committed requirements.

## Implemented

- Phase 0 application scaffold with a React/TypeScript frontend and Django API.
- Material UI, routing shell, and translations for the existing screen in English, Kazakh, and Russian.
- PostgreSQL configuration and an API readiness check.
- Local Docker Compose topology with an Nginx frontend proxy.
- Frontend and backend foundation tests.
- Domain phase (phase 2 of the nine-item roadmap): nine pharmacy models, PostgreSQL constraints, initial migration, repeatable fictional demo seeds, ERD, and domain tests. See `database.md`.

## Next implementation phase

Phases 3–6 now provide session authentication, patient registration, Admin/Pharmacist/Patient authorization, scoped patient data, account profile editing, transactional Rx/OTC dispensing, resource forms, history, multi-entity search, and complete UI dictionaries for English/Kazakh/Russian. See `application.md` for endpoints, operation and limitations. Django's existing User and Groups remain authoritative for roles.

Phase 7 artifacts and Phase 8 local technical acceptance are now prepared. Start at `evidence-index.md`, `progress/current-status.md`, and `verification/acceptance-report.md`. The 12-slide editable deck is in `presentation/`. Weekly criterion records 01–09 are explicitly reconstructed with actual completion dates; week-10.md contains the implementation history and week-11.md contains proposed future member tasks.

Only Phase 9 (VPS deployment) remains from the nine-item technical roadmap. The separate Week 11 admin panel and frontend redesign were implemented on 2026-11-08, with 52 passing tests plus 21 backend subtests. Read `verification/week11-design-review.md`, `application.md` and the completion entry in `progress/week-11.md`. Admin APIs are isolated under `/api/admin/`; the UI uses Workspace, Dashboard, RecordList, ResourceForm and AdminPanel components with merged three-language dictionaries. Presentation files were not changed for this milestone.

Instructor topic-approval evidence, student AI-policy/review confirmation, fluent-speaker translation review and actual team rehearsal remain pending. Do not describe those human actions as completed.

## Constraints

- Educational MVP; fictional data only.
- Do not treat the scaffold as completed Week 1–10 functionality.
- Preserve actual completion dates and individual contribution evidence.
- Never push without Ehsan's explicit approval.
- Update this context and `docs/progress/` after each completed part.
