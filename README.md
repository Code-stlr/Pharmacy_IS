# Pharmacy IS

A pharmacy management web application built with React, Django and PostgreSQL. Pharmacists manage patients, prescriptions and inventory; patients view their own records; administrators manage users and reference data.

This is a university MVP using fictional data. It is not intended for real clinical use.

## Features

- Session-based authentication with Admin, Pharmacist and Patient roles.
- Patient registration, profiles, prescriptions and dispensing history.
- Medication catalog, categories, suppliers, doctors and inventory batches.
- Prescription and OTC dispensing with validation and atomic stock updates.
- Search across patients, medications and prescriptions.
- Administrator-only user and reference-data management, with confirmed deletion and protected history.
- Responsive interface in English, Kazakh and Russian.

## Stack

React, TypeScript, Vite, Material UI and i18next on the frontend. Django REST Framework and PostgreSQL on the backend. Docker Compose runs PostgreSQL, Gunicorn/Django and an Nginx frontend proxy.

## Run locally

Install Docker Desktop with Linux containers and Docker Compose.

1. Copy `.env.example` to `.env`.
2. Set a unique `DJANGO_SECRET_KEY` and `POSTGRES_PASSWORD` in `.env`. Keep this file out of Git.
3. Start the application:

```powershell
docker compose up --build -d
docker compose exec backend python manage.py seed_demo
```

4. Choose a strong, local-only demo password and create the demo accounts:

```powershell
$env:DEMO_PASSWORD='replace-with-your-demo-password'
docker compose exec -e DEMO_PASSWORD=$env:DEMO_PASSWORD backend python manage.py create_demo_users
```

5. Open [localhost:8080](http://localhost:8080). Sign in as `admin_demo`, `pharmacist_demo` or `patient_demo` using the password you chose. Public registration creates Patient accounts only.

Migrations run on startup. PostgreSQL data persists in a Docker volume. Seed commands create missing records without resetting existing stock or account passwords. API readiness is available at `/api/health/`; authenticated API documentation is at `/api/docs/`.

This configuration is for local use. Public hosting still needs TLS, production settings, secret management and verified backups.

## Tests

For the complete isolated verification, install Node 24 and the browser dependencies, then run:

```powershell
cd frontend
npm ci
npx playwright install chromium
cd ..
$env:DEMO_PASSWORD='replace-with-your-demo-password'
./scripts/verify.ps1
```

The script builds a separate acceptance stack on port 8181 and runs backend, frontend, schema and browser checks without resetting the main database. Use the acceptance accounts' existing password on later runs. See the [application guide](docs/application.md) for individual test commands and development setup.

## Documentation

| Document | Contents |
|---|---|
| [Application guide](docs/application.md) | Roles, workflows, API, localization and development |
| [Architecture](docs/architecture.md) | Components, security boundaries and technical decisions |
| [Database](docs/database.md) | PostgreSQL entities, constraints, migrations and stock rules |
| [ER diagram](docs/diagrams/domain-erd.md) | Schema relationships and diagram export instructions |
| [Task register](docs/task-register.md) | Current tasks, owners, deadlines, status and completion evidence |
| [Weekly progress](docs/progress/current-status.md) | Current team report and preserved weekly history |
| [Requirements](docs/requirements.md) | Project aim, objectives and acceptance criteria |
| [AI usage](docs/ai-usage.md) | Assistance disclosure and student verification responsibilities |
| [Semester plan](semester_mvp_project_plan.md) | Governing weekly course criteria |
| [Project graph](graphify-out/GRAPH_REPORT.md) | Code/document relationships, graph audit and suggested questions; download [graph.html](graphify-out/graph.html) to open the interactive view in a browser |

## Contributing

Use a feature branch and your own Git identity. Include relevant tests and a clear description of the change, then review before merging into `main`. Use fictional data only and disclose AI assistance accurately in contribution descriptions. Never commit credentials or local environment files.
