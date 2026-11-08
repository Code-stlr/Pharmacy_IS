# Pharmacy IS workspace redesign and Week 11 admin

Recorded 2026-11-08. Output stays in the existing React/TypeScript/Vite/Material UI stack. Scope is the complete operational interface and dedicated admin area, not a marketing landing page. No presentation changes are part of this task.

## Brief and signature

Audience: pharmacists completing repeat work, patients reading their own records, and admins managing access/reference data. Mood: calm, precise, considered. The signature is an editorial daily overview paired with a live stock-status composition: oversized real numbers, fine dividers, one forest-green action area and a readable recent-activity ledger. Counts and activity must come from API data. No fabricated trend percentages, claims of clinical safety, or decorative charts.

The free design references inform the restrained product-sidebar structure and light editorial spacing. They do not contribute copied names, text, testimonials or assets. This app uses no video or stock photos because its operational data is the useful visual content. The no-media direction uses type, controlled surfaces and short entrances. All visual assets are code-native SVG icons or actual application data. The screenshot loop is required for desktop, mobile, login and admin.

## Files and typography

Keep Material UI for accessible inputs/dialogs/drawer. Introduce a shared Workspace shell, compact SVG Icon component, Dashboard, RecordList, ResourceForm and AdminPanel. Preserve API/session utilities and backend dispensing service. Move view-specific rendering out of the old monolithic App where needed for clarity. Do not add an animation or chart dependency.

Self-host Inter Variable through @fontsource-variable/inter, including Cyrillic subsets for the existing languages. UI fallback is Arial/sans-serif. Login display accent uses Georgia italic as a deliberate system serif, not an unloaded web font. Body 14px/1.6, labels 12px/1.5, buttons 13px/1.4 at weight 600, sidebar 13px/1.5 at weight 500. Page titles use clamp(28px,3vw,38px), weight 600, tracking -0.045em, line-height 1.15. Hero login display is clamp(44px,5.2vw,78px), tracking -0.05em, line-height 1.04. Big metrics are 36px/1 at weight 500 and tabular numerals. Table headers are 11px uppercase with 0.06em tracking, and table bodies 13px/1.5. Record names are 14px/1.5 semibold.

## Tokens and surfaces

html/body start with #F5F6F2 and ink #182B25 to prevent a white flash. Main background #F5F6F2, white surfaces #FFFFFF, sidebar #FCFDFB, borders #E1E7DF, muted text #66746B, primary forest #245746, pale green #EAF0E8, accent lime #DCE9B6, danger #A53335 and danger pale #FAEEEE. Forest appears in primary actions, active navigation and the single dashboard feature. Lime appears only inside the forest feature and small status accents. Avoid low-opacity body text. Real body text must pass WCAG AA contrast.

Cards have 16px radius, 1px border, no default elevation; dialogs 20px; buttons 8px with minimum 44px touch height. Secondary actions are outlined or text. Restrained shadows are reserved for dialogs/drawer and the featured overview panel: 0 12px 32px rgba(24,43,37,.05). The rest of the interface uses dividers and whitespace. Focus outlines are 3px #245746 with 3px offset. Error states use text plus an icon, never color alone.

## Layout and reading order

Desktop >=1100px: fixed 226px sidebar, remaining width for the workspace. Sidebar is full height with a brand block 88px high, operation links separated into primary workflow and reference-data sections, then account/logout at the bottom. A 72px white top bar contains the current workspace breadcrumb at left, localized date and language selector at right. Main area max-width 1440px, padding 32px 36px 48px. Page header has a 12px eyebrow, one h1, explanatory copy and one right-aligned primary action. The overview has a three-column metric strip followed by a 1.5fr/1fr activity/stock layout. No feature competes with the primary action.

At 768–1099px, sidebar becomes a drawer and content padding becomes 28px. At <=767px, header is 64px, main padding 20px 16px 36px, title 28px, metrics use a responsive grid and split panels become one column. Tables become stacked record rows rather than causing document-wide horizontal scroll. Labels sit above values. Forms use two columns >=768px and one column below, with actions pinned only within their dialog. Every drawer action closes the drawer; Escape and backdrop dismiss it, with MUI focus trapping. No hidden navigation can receive focus while the drawer is closed.

## Screens and real copy

Login pairs the wordmark and the headline “One place. A clearer workflow.” with the functional sign-in form. Supporting copy: “Patient records, prescriptions and inventory, connected.” The educational fictional-data notice remains visible in the footer. Desktop login columns are 54%/46% with a fine divider. Mobile puts a shorter heading above the form and keeps the submit button visible without a large decorative block. Existing Username, Password, Sign in and Create patient account labels remain recognizable and translated.

Overview heading: “Your pharmacy, at a glance.” Three real metrics cover patients, available stock units and active prescriptions for staff. Patient overview uses only their scoped data. The stock-status feature counts healthy, low-stock (1–20 units), unavailable (0 units) and expired/not-yet-received batches, with exact definitions in helper copy. Activity shows the latest real dispensing records with patient name, medication, quantity and localized time. Empty states use concise translated copy and an appropriate action only when the role permits it.

Patients, medications and reference screens use a bordered ledger with compact rows, a count and a search toolbar. Forms open in a dialog instead of appending below a long list. Inventory shows batch, medicine, expiry, stock and unit price. Prescription rows show reference, patient, status and expandable line details. Dispensing keeps patient/batch/prescription/quantity fields, real remaining allowance, and the existing confirmation before stock changes. Profiles preserve view/edit behavior. All existing user journeys remain available.

## Admin boundary and CRUD

The dedicated browser route is /admin. An unauthenticated request goes to the login UI, and an authenticated non-admin sees a translated access-denied state with a workspace link. Hiding navigation is supplemental; every /api/admin endpoint independently checks the Admin role. Use a separate admin endpoint namespace for users and eligible reference records. Admin users are not equivalent to Django is_staff.

Admin user CRUD exposes username, name, email, one recognized role, active state and an optional password for creation/reset. Passwords are write-only, validated and hashed. Never expose is_superuser, raw permissions or password hashes. Reject deleting oneself, deleting a superuser, deleting accounts linked to clinical history, and disabling/demoting the last active admin. Linked accounts should be deactivated when appropriate. Catalog CRUD supports eligible categories, suppliers, doctors, medications and patients, while protecting referenced records. Batches, prescription lines and dispensing history are not destructively edited through this panel.

Every delete first opens a dialog naming the exact record and explaining that linked records may block removal. A successful delete refreshes the ledger; a protected deletion returns a translated explanation. Update/create errors remain in the form. Backend transactions and integrity handling protect concurrent changes. Admin forms cannot update stock or erase history.

## Motion and interaction

Signature entrance: fade-rise from opacity 0/translateY(12px) to rest in 480ms, cubic-bezier(.22,1,.36,1). Heading delay 0ms, metrics delay=40+i*50ms, lower panels 140ms. No count animation changes the meaning of live metrics. Hover transitions run for 160ms; row background changes only. Buttons shift at most -1px on hover. Dialog motion stays with MUI defaults. The interface never blocks interaction waiting for an entrance, and rest styles are visible if animations fail. prefers-reduced-motion disables custom animations and transforms. Do not animate table content or destructive confirmation.

## Acceptance

Preserve all existing API/browser tests, add server tests for admin denial, user password hashing, CRUD, self/last-admin guards and protected deletion. Add browser proof of admin creation/edit/deletion and direct non-admin /admin denial, plus all three language states. Run accessibility checks and inspect 1440px and 390px screenshots. Review the three weakest design areas, fix them and capture again. No console exceptions, missing fonts, or horizontal overflow are acceptable. The final screenshot and review scores must describe the actual implemented build.
