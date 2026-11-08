# Week 11 frontend and administration review

Implemented and reviewed 2026-11-08 on `ehsan/week11-admin-design`, with AI assistance under Ehsan's direction. This is an implementation review, not independent student review or instructor acceptance. No presentation files were changed.

## Design and evidence

The pharmacy workspace uses ivory surfaces, forest-green emphasis, locally hosted Inter with Cyrillic support, thin ledger rules and a responsive sidebar. The sign-in screen pairs editorial serif display text with a simple form. A dark inventory panel and actual operational data provide the dashboard's signature. This is intentionally a data-led, no-photo application; decorative stock imagery would compete with clinical tasks.

The specification is in `../frontend-design-spec.md`. Screenshots are fictional data from the isolated acceptance database, not production records:

- [Before: desktop](week11/screenshots/before-desktop.png)
- [After: overview desktop](week11/screenshots/overview-desktop.png)
- [After: overview mobile](week11/screenshots/overview-mobile.png)
- [Admin desktop](week11/screenshots/admin-desktop.png)
- [Admin mobile](week11/screenshots/admin-mobile.png)
- [Sign-in desktop](week11/screenshots/login-desktop.png)

Reproduce captures with `DEMO_PASSWORD` set, then `node scripts/capture-workspace.mjs .build/design-review` and `node scripts/capture-workspace.mjs .build/admin-review /admin`. `PLAYWRIGHT_BASE_URL` selects the running stack. The project-installed Node Playwright was used because the skill's standalone Python capture runtime lacked its browser dependencies.

## Review loop

Round 1: inspected desktop/mobile sign-in and authenticated overview. The three weakest areas were typography (small navigation/support text), polish (sidebar wordmark wrapping) and data presentation (zero-count chart segments). Navigation became 13px, ledger text 12px, the 19px wordmark became non-wrapping, and zero-count chart segments were removed. Stock classification also excludes inactive medicines from available stock.

Round 2: inspected overview and admin at both widths. Accessibility checks found low contrast in secondary text and branding. Muted text was darkened to `#5c6f60`, table headings to `#596c5b`, the wordmark accent to `#526749` and empty-state text to `#596f56`. Browser selectors were updated for actual links and ledger rows. The normal login throttle was retained; repeated automated logins use a test-only override.

Round 3: inspected final overview, admin, sign-in and early render frames. Desktop 1440×1000 and mobile 390×844 QA reports show fonts loaded, no page errors and no horizontal overflow. The early sign-in frame has the intended ivory background and visible form. The complete acceptance script passed. Entrance motion is a short fade/rise with reduced-motion override; dialogs and mobile navigation retain MUI focus handling.

Self-assessed rubric, scored for an operational web application:

| Criterion | Score / 10 | Observation |
|---|---|---|
| First glance | 8 | Overview headline, inventory and primary action form a clear hierarchy |
| Signature | 8 | Editorial sign-in and forest inventory feature establish a consistent identity |
| Typography | 8 | Two families on sign-in, readable Inter elsewhere, consistent scale |
| Composition and space | 9 | Aligned ledgers, grouped metrics and deliberate negative space |
| Colour and light | 8 | Restrained ivory/forest palette, verified contrast on scanned states |
| Media integration | 8 | No photographic media; real data and SVG icons are integrated into the layout |
| Motion | 7 | Restrained entrance and interaction motion; intentionally limited for repeated tasks |
| Mobile | 8 | Drawer navigation, full-width actions and stacked record details |
| Copy | 8 | Task-oriented labels and protective deletion explanations |
| Polish | 8 | Focus states, titles, local fonts, stable layout and confirmed destructive actions |

Average **8.0**, no score below 7. Remaining weakest areas: deliberately modest motion, mobile admin tabs requiring horizontal scrolling, and compact secondary text. These are acceptable MVP tradeoffs; usability review with students should guide further changes. Scores are subjective, not a benchmark certification.

## Week 11 acceptance mapping

| Requirement | Implemented evidence |
|---|---|
| Dedicated admin panel | `/admin`, admin-only navigation, direct-route denial |
| Manage users | Create/read/edit/delete eligible accounts, roles and activation |
| Manage reference data | Medications, categories, suppliers, doctors and patients |
| Confirm deletion | Record-specific confirmation, cancellation browser test |
| Protect linked history | HTTP 409 for referenced records; no prescription/batch/dispensing delete endpoints |
| Protect access | Active Admin API permission, self/superuser guards, serialized account updates |
| Three languages | English, Kazakh and Russian dictionaries and browser switching |
| Demonstrable correctness | 52 tests plus 21 backend subtests; see acceptance-report.md |

VPS deployment, fluent-speaker review, independent member contributions and actual classroom rehearsal remain pending. The production JavaScript chunk is approximately 599 KB before gzip; code splitting remains a future optimization.
