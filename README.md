# Pharmacy IS

Educational pharmacy web application. Start with [the approved plan](docs/project-plan.md) and [current project context](docs/project-context.md).

For the teacher check, open the [evidence index](docs/evidence-index.md), [current weekly report](docs/progress/current-status.md), [presentation](docs/presentation/pharmacy-is-week10.pptx), and [acceptance report](docs/verification/acceptance-report.md). Run `scripts/verify.ps1` with `DEMO_PASSWORD` set to repeat the isolated technical demonstration on port 8181 without resetting the main database.

## Current state

Phases 1–6 provide a working React/Django/PostgreSQL MVP: session authentication, role permissions, patient and inventory forms, prescriptions, atomic dispensing, history, multi-entity search and English/Kazakh/Russian interfaces. The original prototype remains unchanged at `DB/SQLite.db`. See [application guide](docs/application.md), [database documentation](docs/database.md), and [ERD](docs/diagrams/domain-erd.md).

## Run locally with Docker

Requires Docker Desktop with Linux containers and Docker Compose.

1. Copy `.env.example` to `.env`.
2. Replace both placeholder secrets with unique local values. For example, generate a secret with `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
3. Run `docker compose up --build`.
4. Open http://localhost:8080. A successful health check confirms the API can query PostgreSQL.

Compose applies migrations before launching Django. PostgreSQL data persists in the `postgres_data` volume. API schema and documentation require authentication by default and will be available after the authentication phase.

The Compose configuration is for local demonstrations. VPS work still requires TLS, secure production settings, backup procedures, and deployment verification.

## Develop without rebuilding containers

Use Python 3.14 and Node 24. PostgreSQL must be running separately; set the environment variables from `.env.example` in your shell, plus `POSTGRES_HOST` and optionally `POSTGRES_PORT`. Django does not automatically load `.env`; Docker Compose does.

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r backend/requirements.txt
cd backend
..\.venv\Scripts\python manage.py migrate
..\.venv\Scripts\python manage.py runserver
```

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Vite proxies `/api` to Django so session authentication can stay on the same origin.

## Verify

With `DJANGO_SECRET_KEY` set, run from `backend/`:

```powershell
..\.venv\Scripts\python manage.py check
..\.venv\Scripts\python -m pytest
```

The foundation tests mock database availability; they do not prove a live PostgreSQL connection. From `frontend/`, run `npm test` and `npm run build`. After starting Compose, check `/api/health/` through port 8080 for the real database readiness result.

## Team workflow

Use a personal feature branch and your own Git identity. Review changes before merging. AI-assisted work is documented in weekly progress; never assign commits to someone who did not author them. Remote pushes by the assistant require Ehsan's explicit approval.
