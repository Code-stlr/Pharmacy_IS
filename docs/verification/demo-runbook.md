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

## Week 11 admin demonstration (about 4 minutes)

1. Sign in as `admin_demo`. Show the overview's real inventory counts, then open Admin panel.
2. In Users, create a fictional test user with a strong password and Patient role. Search for it, edit its email and show the saved value.
3. Select Delete, cancel once and show the record still exists. Confirm deletion of this unlinked test account.
4. In Categories, create, rename and delete an unused demo category. Attempt to delete the seeded category referenced by medication: the UI must explain that linked history is protected.
5. Switch English → Kazakh → Russian. At mobile width, open navigation and show the responsive record cards.
6. Sign out and sign in as `pharmacist_demo`. Admin navigation is absent and direct `/admin` access is denied. Server tests independently prove API denial.

No new slides are needed for this workflow. Do not delete seeded users or patient/clinical history for demonstration. Use the acceptance stack if repeated logins hit the normal 10/minute limit.

## Recovery steps

If login fails, confirm the demo password and check existing credentials rather than rerunning seeds expecting a reset. If the API is unavailable, inspect docker compose logs backend and /api/health/. If a request result is uncertain, inspect history before retrying. Do not delete the real demo volume to repair a presentation. The acceptance stack uses its own volume and can demonstrate a clean environment without touching the main database.

## Individual questions

- Ehsan: How do the aim, use cases and SWOT decision limit scope?
- Garifolla: Why does PrescriptionLine exist, and which invariants are database constraints?
- Damir: How do resource forms, API errors and language switching work?
- Yerassyl: Why are CSRF and ownership filters both necessary?
- Yerdos: How do the concurrent tests prove that stock cannot be oversold?

Instructor topic approval, each student's personal evidence and the actual group rehearsal must be confirmed by the team. Do not claim they happened from an automated run.
