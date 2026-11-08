# Week 11 plan — 2026-11-09 to 2026-11-15

Prepared 2026-11-08. This is a forward plan, not a claim that future tasks are complete. Current stage: Working System. Health: At Risk until topic approval, contribution review and team rehearsal are confirmed.

Current assignments/status are maintained in the [central task register](../task-register.md). This file preserves the original plan and dated results. Next-member task IDs are TEAM-01 (Ehsan), DATA-02 (Garifolla), UI-03 (Damir), SEC-01 (Yerassyl) and QA-02 (Yerdos). The completed admin/redesign milestones are ADMIN-01 and UI-02. Update the register and this weekly record together; the older proposal below remains planning history.

## Starting point

Phases 1–6 implementation and local automated/browser evidence exist. Phase 7 course artifacts and Phase 8 technical acceptance evidence are prepared. At the time this forward plan was drafted, the dedicated admin panel and VPS deployment were pending. The dated completion entry below records the subsequent admin work.

## Proposed member tasks for the next lesson

All deadlines below are proposed for 2026-11-15 at 18:00 Asia/Qyzylorda and need team agreement.

| Owner | Measurable task | Checkable result |
|---|---|---|
| Ehsan Bali | Verify topic approval, review aim/UML/deck and coordinate teacher report | Approval evidence reference, reviewed docs commit and completed rehearsal record |
| Garifolla Mukhammed | Review schema/ERD and propose tested correction or improvement | Own reviewed branch/commit, before/after schema explanation and passing tests |
| Kaiyzhanov Damir | Build dedicated admin screens with an admin-only route | Own reviewed branch/commit and browser proof of allowed/denied navigation |
| Baiyrov Yerassyl | Add protected admin APIs and eligible-record deletion rules | Own reviewed branch/commit, role-denial and protected-history tests |
| Daulet Yerdos | Review acceptance evidence and test admin workflows | Own test branch/commit, defect record and reproducible demonstration |

Every member must explain their own contribution. Existing AI-assisted commits under Ehsan's identity are not evidence that other students authored the work. Each week adds an actual result, evidence, risk and next task to a new weekly record.

## Actual completion — 2026-11-08

At Ehsan's request, Week 11 administration was brought forward for Monday's demonstration. Ehsan's AI-assisted working branch implements the protected admin route, user/reference CRUD, confirmed eligible deletion, protected clinical history, account safeguards, responsive frontend redesign and English/Kazakh/Russian interface. Evidence: `../verification/acceptance-report.md`, `../verification/week11-design-review.md` and `../verification/demo-runbook.md`. Full acceptance passed: 40 backend tests plus 21 subtests, 4 frontend tests and 8 browser scenarios. No new presentation was made. VPS deployment is still pending.

The proposed tasks above are retained as planning history; they do not attribute this implementation to other students. Revised improvements, proposed deadline 2026-11-15 18:00 Asia/Qyzylorda:

| Owner | Next measurable improvement | Evidence |
|---|---|---|
| Ehsan Bali | Coordinate approval and an admin-demo rehearsal | Approval reference and dated rehearsal record |
| Garifolla Mukhammed | Review deletion dependencies and propose one schema improvement | Own reviewed commit, dependency explanation and relevant test |
| Kaiyzhanov Damir | Review mobile admin usability and improve one observed issue | Own commit and before/after screenshots |
| Baiyrov Yerassyl | Independently review admin permissions and improve one security case | Own reviewed commit and regression test |
| Daulet Yerdos | Execute admin runbook and add one uncovered acceptance case | Own commit, run result and defect evidence |
