# Pharmacy IS — Agreed Project Plan

**Status:** Approved after project-planning interview  
**Approved by:** Ehsan Bali  
**Approval date:** 2026-11-08

## 1. Purpose and governing documents

This document records the shared implementation decisions for Pharmacy IS so that a team member or AI assistant can continue the project without relying on chat history.

The course requirements remain defined by:

- [`../semester_mvp_project_plan.md`](../semester_mvp_project_plan.md)
- [`../weekly_project_status_check_and_final_goal.md`](../weekly_project_status_check_and_final_goal.md)
- [`../pharmacy_is_team_roles.md`](../pharmacy_is_team_roles.md)

Weeks 1–10 will be completed as one coherent application rather than as ten isolated projects. Work and evidence will still be mapped to the week whose criterion it satisfies. Actual completion dates must remain truthful.

## 2. Definition of done

A requirement is done only when it:

1. exists;
2. works correctly; and
3. can be demonstrated.

Documents must contain real Pharmacy IS content. Application behavior must be verifiable through a live demonstration or an automated test. Planned or incomplete work must not be reported as completed.

## 3. Product boundary

Pharmacy IS is an educational MVP. It uses fictional data and is not approved for real clinical or pharmacy operations.

The principal workflow is:

> A pharmacist finds a patient, validates a prescription, selects an appropriate medication batch, dispenses the medication, reduces stock, and records the transaction.

### Authenticated actors

- **Admin:** manages users, roles, and system records.
- **Pharmacist:** manages patients, prescriptions, dispensing, and inventory.
- **Patient:** views their profile, prescriptions, and dispensing history.

Doctors are domain records in the initial MVP rather than authenticated users.

## 4. Week 1–10 feature scope

The application must provide:

1. User login and role-based access.
2. Patient registration and profile management.
3. Medication, category, supplier, and batch inventory.
4. Prescription creation and validation.
5. Safe medication dispensing with atomic stock reduction.
6. Prescription and dispensing history.
7. Search across patients, medications, and prescriptions.
8. English, Kazakh, and Russian interfaces.
9. Responsive forms, validation messages, error states, and empty states.

Week 11 adds a dedicated protected admin experience with CRUD operations and confirmation for destructive actions.

## 5. Architecture decision

### Frontend

- React with TypeScript and Vite
- Material UI
- React Router
- i18next for English, Kazakh, and Russian

### Backend

- Python and Django
- Django REST Framework
- Same-domain session-cookie authentication
- CSRF protection and role-based authorization
- OpenAPI documentation

### Data and operations

- PostgreSQL as the authoritative application database
- Django migrations and controlled seed data
- Docker Compose for development and deployment
- Nginx, Gunicorn, Django, React static assets, and PostgreSQL on a VPS

### Testing

- pytest and Django test tooling for backend behavior
- React Testing Library for frontend components
- A focused Playwright suite for critical end-to-end workflows

The separate frontend and backend add integration work but provide a maintainable long-term structure and clear team boundaries.

## 6. Existing SQLite prototype

`../DB/SQLite.db` is a prototype, not the production source of truth. It must be preserved for reference before it is relocated or otherwise changed.

The authoritative schema will be recreated through reviewed Django migrations. Seed data must be fictional. Known prototype problems—including incomplete prescription detail, unclear stock semantics, disabled runtime foreign-key enforcement, and unsafe sample relationships—must not be copied blindly.

## 7. Course-week evidence map

| Week | Required project evidence |
|---|---|
| 1 | Pharmacy problem, measurable aim, objectives, and team roles |
| 2 | Actors, use cases, UML, stack, Git workflow, and README |
| 3 | Competitor analysis, SWOT, and wireframes |
| 4 | PostgreSQL design, ERD, migrations, constraints, and seed data |
| 5 | Authentication and role-based access |
| 6 | End-to-end dispensing and database/stock update |
| 7 | Validation, profiles, and history |
| 8 | Cleanup, documented AI use, progress evidence, and repository hygiene |
| 9 | Search across patients, medications, and prescriptions |
| 10 | Complete English, Kazakh, and Russian localization |

## 8. Stable team ownership

- **Ehsan Bali — Systems Analysis & Requirements:** requirements, scope, use cases, competitor analysis, SWOT, progress records, presentation coordination, and acceptance review.
- **Garifolla Mukhammed — Data & Database:** PostgreSQL models, migrations, constraints, seed data, ERD, and data documentation.
- **Kaiyzhanov Damir — Application & Development:** React application, forms, core workflows, and responsive user-facing screens.
- **Baiyrov Yerassyl — Architecture & Security:** Django API, authentication, authorization, security review, and deployment.
- **Daulet Yerdos — Testing, Analytics & Integration:** automated tests, integration verification, defect tracking, analytics, and demonstration verification.

Ownership remains stable, but every member must complete at least one measurable improvement each week.

## 9. Git working agreement

- Every member works on a named branch using their own Git identity.
- Commits must describe one understandable unit of work.
- Changes are reviewed before being merged into `main`.
- Individual contribution evidence must reference branches and commits.
- The AI assistant must not push to the remote repository without Ehsan Bali's explicit approval.

## 10. Weekly project memory

The [central task register](task-register.md) is authoritative for current task IDs, status, owners, deadlines and completion evidence. The weekly files preserve dated plans, actual results and reasons for changes. Reference the same task IDs in both; do not replace historical weekly plans when carrying work forward. Proposed member assignments require team agreement. Implementation roadmap completion does not imply that all later semester criteria or human approvals are complete.

Each week receives `docs/progress/week-XX.md` with:

- planned work;
- completed work;
- demonstration evidence;
- contribution by each member;
- problems and risks;
- decisions made;
- deferred work;
- next week's measurable tasks; and
- relevant commits or pull requests.

The weekly status document summarizes the current state. Weekly files preserve the historical sequence: what was completed, what was expected next, and what actually happened.

## 11. Implementation order

1. **Foundation:** repository structure, preserved SQLite prototype, React/Django scaffolds, PostgreSQL, Docker Compose, and README.
2. **Domain:** corrected models, migrations, constraints, seed data, and ERD.
3. **Security:** authentication, CSRF handling, and Admin/Pharmacist/Patient authorization.
4. **Core workflow:** prescription validation, dispensing, atomic stock reduction, and history.
5. **Application:** profiles, inventory screens, search, responsive UI, validation, errors, and empty states.
6. **Localization:** complete English, Kazakh, and Russian coverage.
7. **Evidence:** UML, competitors, SWOT, wireframes, weekly records, and presentation material.
8. **Verification:** automated tests, manual demonstration script, and clean-environment setup test.
9. **Deployment:** containerized VPS deployment after the local MVP is stable.

## 12. Initial repository target

```text
backend/
frontend/
docs/
  decisions/
  diagrams/
  progress/
  presentation/
  project-plan.md
  project-context.md
  requirements.md
  architecture.md
  database.md
  use-cases.md
legacy/
  SQLite.db
docker-compose.yml
README.md
```

This structure is a target, not evidence that every listed artifact already exists.
