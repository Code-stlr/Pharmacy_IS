# Teacher demonstration runbook

Target: 8–10 minutes plus questions. Start at http://localhost:8080, or port 8181 for the isolated acceptance stack. Use fictional accounts from docs/application.md. Preload dependencies and Docker images before class.

| Time | Action | Expected evidence |
|---|---|---|
| 0:00–1:00 | Present problem, aim and five objectives | Slides and requirements.md |
| 1:00–2:00 | Explain competitors, SWOT decision, actors and ERD | Course evidence diagrams and comparison |
| 2:00–3:00 | Sign in as pharmacist; search for a patient and a medication | Matching records, search and empty states |
| 3:00–5:00 | Create prescription and dispense a small quantity | Updated stock, transaction history, remaining quantity |
| 5:00–6:00 | Attempt more than the remaining amount | Translated rejection and unchanged stock/history |
| 6:00–7:00 | Sign in as patient_demo; inspect own history and profile | No staff actions or other patient records |
| 7:00–8:00 | Change language on profile/search/history | en/kk/ru UI transitions |
| 8:00–9:00 | Show test report and explain a concurrency test | Verification report, actual test logs |
| 9:00–10:00 | Explain next tasks and limits | Week 11 plan and individual ownership |

## Preparation

1. Start Docker Desktop and the local stack. Check /api/health/ returns ok.
2. Run seed_demo and create_demo_users only if needed. Seeds do not reset depleted stock or completed prescriptions.
3. Use a fresh fictional prescription for the demonstration. Choose an available batch with more than the planned dispense quantity.
4. Open diagrams, slides and report before the class. Downloaded images and built containers allow a local demonstration.
5. Every member reviews their code/docs and rehearses their explanation. A technical automated run does not prove that the team has rehearsed.

## Recovery

If login fails, confirm the demo password and check existing credentials rather than rerunning seeds expecting a reset. If the API is unavailable, inspect docker compose logs backend and /api/health/. If a request result is uncertain, inspect history before retrying. Do not delete the real demo volume to repair a presentation. The acceptance stack uses its own volume and can demonstrate a clean environment without touching the main database.

## Individual questions

- Ehsan: How do the aim, use cases and SWOT decision limit scope?
- Garifolla: Why does PrescriptionLine exist, and which invariants are database constraints?
- Damir: How do resource forms, API errors and language switching work?
- Yerassyl: Why are CSRF and ownership filters both necessary?
- Yerdos: How do the concurrent tests prove that stock cannot be oversold?

Instructor topic approval, each student's personal evidence and the actual group rehearsal must be confirmed by the team. Do not claim they happened from an automated run.
