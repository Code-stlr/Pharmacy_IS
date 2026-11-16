# Week 13 plan — November 23–29, 2026

Drafted November 16 from the [semester roadmap](../../semester_mvp_project_plan.md#week-13-emerging-tech-polish--edge-case-handling). Proposed review and evidence deadline is **November 29 at 18:00 Asia/Qyzylorda**, subject to team agreement. The [task register](../task-register.md) tracks status and actual completion dates.

## Goal

Make the current app easier to use when input is invalid, a list is empty, or a service fails. For the roadmap’s emerging-tech work, propose polishing the existing Multiple search page. Show what happens when one provider fails, every provider is unavailable, or a search has no results.

## Week 12 handoff

On November 23, check the status of these four criteria. Keep any unfinished criterion open under its existing ID and prioritize it ahead of optional polish.

| ID | Evidence to bring into Week 13 |
|---|---|
| W12-01 | Demo and test the status feedback and dispensing history. Record which existing behavior meets the criterion and any remaining gap. |
| W12-02 | Demo one agreed upload or export/reporting workflow. An admin-only stock CSV is a proposed option. Show the output and a denied request from a non-admin account. |
| W12-03 | Attach the security review of password hashing, endpoint authorization, input validation, XSS and SQL-injection protections. Record findings, fixes and tests. |
| W12-04 | Show at least six working functions with reproducible demo steps and evidence. Candidate flows include authentication and roles, profile editing, patient/allergy management, prescriptions and dispensing, internal record search, and admin CRUD. Confirm each live and add the Week 12 activity and reporting workflows once verified. |

## Proposed work by member

| Member | Task and register ID | Evidence for the weekly check |
|---|---|---|
| Ehsan Bali | Review the Week 12 handoff and own the Week 13 demo script for W12-04 and W13-01. | Own documentation commit with the feature inventory, pass/fail criteria and a timed demo covering an invalid form and a service failure. |
| Garifolla Mukhammed | Review the allergy name uniqueness rule and stock data edge cases under DATA-02 and W13-01. Implement one correction if the review finds a reproducible defect. | Own commit with a documented data rule and a PostgreSQL check for duplicate names or stock boundaries. |
| Kaiyzhanov Damir | Fix one reproducible UI issue in the patient, stock or Multiple search flow under W13-01. Review loading, empty and failure messages across en/kk/ru. | Own commit, before/after captures and a browser check at desktop and mobile widths. |
| Baiyrov Yerassyl | Finish the W12-03 review if open, then check how the Multiple search API handles bad queries and partial provider failures under W13-01. | Own commit with a regression test or review note covering the endpoint’s authorization, timeout behavior and error response. Use mocked providers for reproducible tests. |
| Daulet Yerdos | Turn an uncovered W13-01 edge case into a repeatable browser test and verify the weekly demo. | Own test commit and dated run results. Include the expected result and actual outcome for each demo case below. |

## Demo acceptance cases

- Submit a patient form with required fields empty, try an invalid email where email is expected, and enter a wrong password. The app explains each error and leaves the user able to retry.
- Try to create an allergy with an existing name from an unsaved patient form. The app explains the rejection and retains the patient draft and selected allergies. Verify that an authorized user can still add an unlisted allergy and save the patient.
- Open an empty stock filter and then simulate a failed request. Each state has a distinct message and a way back to a working view.
- Check an empty Multiple search query, a successful provider alongside a failed provider, and a complete provider outage. Use mocked responses to show all three cases. Record separately any live provider checks the team runs.

## Checkpoints and handoff

- **November 23:** Review Week 12 evidence and agree on owners, scope and dates. Each member records their own working branch.
- **November 26:** Reproduce the target defects or record verified behavior. Review any Week 12 carryover or external dependency that threatens the demo.
- **November 29:** Run the demo, link each member’s artifact and verification result, and update the register. Carry failed or unverified cases into Week 14 smoke testing and the disconnected demo under W14-01. Track verified individual contributions under W14-02. Week 15 is reserved for final artifacts, code freeze and rehearsal under W15-01.
