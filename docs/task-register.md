# Pharmacy IS — central task register

Updated 2026-11-08. This is the authoritative list of task status, assignment, deadline and completion evidence. [Current status](progress/current-status.md) summarizes it; [weekly records](progress/week-11.md) preserve what was planned and what actually happened. The [requirements](requirements.md) and [semester criteria](../semester_mvp_project_plan.md) govern scope.

## Working rules

- Give each task a permanent ID. Reference that ID in the weekly record and, for new work, the branch/commit or PR description. Keep completed rows.
- Status: **Planned → In progress → Review → Done**. Use **Blocked** only with a recorded blocker and next action. Optional ideas are outside the committed backlog until explicitly accepted.
- Start a task by recording the actual assignee, branch and agreed deadline here. Proposed assignments below have not yet been accepted by the team. All times are Asia/Qyzylorda; TBD means no date has been agreed.
- Done means the result exists, works and can be demonstrated. Record actual completion date, actual contributor, evidence and reviewer. Assistant-run tests are technical evidence; student review and instructor approval are separate tasks.
- Area ownership does not prove authorship. Do not credit teammates for AI-assisted work under Ehsan's identity. Each member must produce a measurable improvement each week, using their own Git identity and branch.
- At each weekly check, update these rows, copy the week's results and next tasks into `progress/week-XX.md`, and refresh `progress/current-status.md`. Carry unfinished IDs forward without changing their original history. Record changed deadlines and reasons in the weekly file.
- Local commits are evidence even before publication. Push only with Ehsan's explicit approval. Do not fabricate remote PR links for local-only commits.

## Stable area owners

| Member | Area | Current personal contribution evidence |
|---|---|---|
| Ehsan Bali | Requirements, scope, coordination and acceptance | Directed scope/architecture and AI-assisted implementation/docs; commits below. Personal rehearsal/review still pending. |
| Garifolla Mukhammed | Database, migrations, constraints and ERD | Independent contribution not yet evidenced in this checkout |
| Kaiyzhanov Damir | Frontend, forms, responsiveness and localization | Independent contribution not yet evidenced in this checkout |
| Baiyrov Yerassyl | API architecture, security and deployment | Independent contribution not yet evidenced in this checkout |
| Daulet Yerdos | Testing, integration, defects and demonstration | Independent contribution not yet evidenced in this checkout |

## Completed technical baseline

All rows below completed **2026-11-08** by **Ehsan-directed, Codex-assisted work under Ehsan's Git identity**. These are technically demonstrated results, not claims of instructor acceptance or independent teammate review. Their original deadlines were not recorded; course weeks identify criteria, not actual completion dates. Historical baseline rows group earlier commits rather than inventing task IDs in old commits.

| ID | Delivered task | Course criterion | Status | Evidence |
|---|---|---|---|---|
| BASE-01 | Agree scope, stack, roles and definition of done | Weeks 1–2 | Done | `91336c2`; agreement retained privately; public [requirements](requirements.md) |
| BASE-02 | React/Django/PostgreSQL foundation, Docker and preserved SQLite | Weeks 2, 4 | Done | `50092c4`, `a1cf426`; [README](../README.md) |
| DATA-01 | Nine domain models, constraints, migrations, seeds and ERD | Week 4 | Done | `d8df053`; [database guide](database.md) |
| AUTH-01 | Registration, sessions, CSRF, roles and patient ownership | Week 5 | Done | `c2f1ea0`; backend auth/permission tests |
| FLOW-01 | Rx/OTC dispensing, validation, atomic stock updates and history | Weeks 6–7 | Done | `c2f1ea0`; concurrency tests and [test workflow](../scripts/verify.ps1) |
| UI-01 | Patient/inventory forms, profiles and multi-entity search | Weeks 7, 9 | Done | `bb034cd`; browser workflows |
| LANG-01 | English, Kazakh and Russian functional UI dictionaries | Week 10 | Done | `bb034cd`, `a0c9548`; key-parity and language-switch tests. Fluent-speaker approval remains LANG-02. |
| DOC-01 | Requirements, analysis, UML/ERD, wireframes, AI disclosure and course artifacts | Weeks 1–3, 7–8 | Done | `d710d15`; [requirements](requirements.md) and internal course artifacts. Human approval/review remains below. |
| QA-01 | Reproducible isolated acceptance stack and local demo runbook | Verification roadmap | Done | `d710d15`, `a0c9548`; [test workflow](../scripts/verify.ps1): 52 tests plus 21 backend subtests |
| ADMIN-01 | Protected admin route, user/reference CRUD, confirmation and history protection | Week 11 | Done | `a0c9548`; admin API/browser tests; [admin guide](application.md#admin-panel) |
| UI-02 | Responsive workspace redesign, real overview and reviewed screenshots | Frontend improvement | Done | `a0c9548`; [frontend source](../frontend/src/Dashboard.tsx); detailed visual review retained privately |
| REVIEW-01 | Review all milestone work for main integration and rerun full acceptance | Repository integration | Done | Reviewed baseline `63c4572`; merge commit `803debe`; detailed integration review retained privately; Codex review under Ehsan's direction, not independent teammate review |

## Next member tasks — proposed, awaiting team agreement

Proposed deadline for each row: **2026-11-15 18:00**. No work is marked started merely because an owner is proposed. Actual contributor, branch, completion date and review evidence remain unrecorded until work occurs.

| ID | Proposed owner | Measurable task / done condition | Status | Branch / result / evidence |
|---|---|---|---|---|
| TEAM-01 | Ehsan Bali | Coordinate approval follow-up and one timed admin-demo rehearsal; link APPROVAL-01 evidence and a dated rehearsal record with attendees, individual explanations and follow-up defects | Planned | Not recorded |
| DATA-02 | Garifolla Mukhammed | Review deletion dependencies and implement one justified schema/data improvement; explain before/after, provide own commit and relevant passing test | Planned | Not recorded |
| UI-03 | Kaiyzhanov Damir | Review mobile admin usability, document an observed issue and fix it; provide own commit, before/after captures and validation | Planned | Not recorded |
| SEC-01 | Baiyrov Yerassyl | Independently review admin authorization and deliver one security improvement with an executable regression case and own reviewed commit | Planned | Not recorded |
| QA-02 | Daulet Yerdos | Execute admin demo steps, record results/defects and add one meaningful uncovered acceptance case with own commit and test output | Planned | Not recorded |

## Remaining required work and human verification

Owners here are proposed coordinators within their stable areas, not evidence that work has been assigned or accepted. Deadlines are **TBD**. All rows have no actual completion date or completion evidence yet. Break larger tasks into linked IDs when implementation scope is agreed.

| ID | Proposed coordinator | Criterion | Task / done condition | Status | Dependency / next action |
|---|---|---|---|---|---|
| APPROVAL-01 | Ehsan | Week 1 | Attach instructor topic-registration/approval evidence | Planned | Confirm with instructor; evidence currently unverified |
| POLICY-01 | Ehsan; all members review | Week 8 | Confirm actual permitted AI-use policy and record each student's review of assisted work | Planned | Read applicable course policy; update ai-usage.md truthfully |
| LANG-02 | Damir coordinates fluent speakers | Week 10 | Review en/kk/ru screens and error states; record reviewers, corrections and results | Planned | Arrange fluent-speaker review |
| W12-01 | Yerdos | Week 12 | Map existing status feedback/dispensing activity to the notification/activity criterion; test it and fill any agreed gap | Planned | Review existing toasts/history before adding features |
| W12-02 | Damir; Yerassyl supports API | Week 12 | Agree and implement one file-upload or export/reporting workflow with permissions, validation and demonstrable output | Planned | Choose useful scope; CSV export is an option, not an approved decision |
| W12-03 | Yerassyl | Week 12 | Record a security review of password handling, authorization, input handling and XSS/SQL-injection boundaries; resolve findings and attach tests | Planned | Existing safeguards are baseline evidence, not a completed independent review |
| W12-04 | Ehsan; Yerdos verifies | Week 12 | Publish a feature inventory mapping more than five distinct working functions to demo steps/evidence | Planned | Include W12-01–03 results and existing functions |
| W13-01 | Damir; Yerdos verifies | Week 13 | Review UI/error consistency, empty/duplicate/invalid input and network failures; record and fix observed gaps | Planned | Existing redesign/tests cover part of this; week-specific review still needed |
| DEPLOY-01 | Yerassyl | Roadmap phase 9 | Deploy to agreed hosting with domain/TLS, secure settings/secrets and verified live health/auth/admin/dispensing workflows | Planned | Hosting/access/domain choice and deployment plan needed |
| OPS-01 | Garifolla; Yerassyl supports | Deployment | Document database backup and successfully restore to an isolated environment; verify representative records/workflows | Planned | Agree target environment and backup procedure |
| W14-01 | Yerdos | Week 14 | Execute full user-journey smoke tests and a genuinely internet-disconnected demo using preloaded dependencies/seeds | Planned | Current public-request-blocking simulation does not prove physical disconnection |
| W14-02 | Ehsan; every member contributes | Week 14 | Verify each member's actual authored/reviewed artifacts, commits and explanations; link evidence by person and week | Planned | Begins with TEAM-01, DATA-02, UI-03, SEC-01 and QA-02; do not fabricate missing history |
| W15-01 | Ehsan; all members | Week 15 | Review final course artifacts, resolve defects, agree code freeze and perform timed individual/team rehearsal | Planned | Existing deck is a draft baseline; no presentation creation authorized in the current task |
| FINAL-01 | All members; Ehsan coordinates | Weeks 16–17 | Deliver live demo and individual defense; record actual instructor feedback/outcome afterward | Planned | Final-exam schedule and human participation |

## Optional ideas — not committed scope

| ID | Idea | State / decision needed |
|---|---|---|
| IDEA-01 | Separate public landing/welcome page before sign-in | Discussed only; owner, scope and deadline unassigned. Current `/` is sign-in when signed out and overview when signed in. |
| IDEA-02 | Self-service password reset | Unscheduled product improvement; decide recovery channel and hosting needs |
| IDEA-03 | Returns, stock corrections and prescription cancellation | Deferred beyond current milestone; requires explicit workflow/data-integrity design |
| IDEA-04 | Pagination, large-data performance and frontend code splitting | Unscheduled optimization; prioritize using measured needs |

## Completion entry format

When finishing an open task, update its row and add its result below or link a dated weekly entry containing: **ID; actual contributor(s); actual completion date; branch/commit; observable result; test/demo evidence; reviewer and review outcome; remaining limits**. Do not mark independent review complete without naming the person who actually performed it. If scope, status or deadline changes, record the reason in the weekly record.

## Register history

- 2026-11-08: Ehsan clarified the public boundary: restored this register, progress folder, requirements, AI disclosure and semester plan for shared Git tracking. Presentations and detailed internal evidence stay private. Public links now point to available source/tests; private evidence is identified without requiring a private file to navigate the register. This supersedes the earlier local-only tracking arrangement below.

- 2026-11-08: Documentation cleanup under Ehsan's direction moved this register, weekly/course artifacts and legacy SQLite into ignored `.private/`. Public README/technical docs were simplified; the internal project agreement no longer duplicates the completed Week 1–10 feature scope or contains a SQLite section. See `../DOCUMENTATION.md`. This is local preparation; previously published history/branches remain public until separately addressed.

- 2026-11-08: Created from the approved plan, existing weekly records, verified local commit history and acceptance evidence. Imported completed baseline without assigning it to absent teammates; copied next-member tasks as proposals; added remaining semester/deployment requirements and separated optional ideas. This register itself is AI-assisted documentation under Ehsan's direction.
