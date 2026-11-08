# Competitor comparison and SWOT

Research date: 2026-11-08. Scope: two real commercial pharmacy platforms compared with this educational MVP across six named criteria. Vendor descriptions indicate advertised capability, not independent performance testing or a recommendation to buy. Prices and Kazakhstan availability were not verified. A feature absent from the reviewed pages is marked not established, not absent from the product.

## Evidence sources

- S1: [PrimeRx Cloud official overview](https://lp.primerx.io/primerx-cloud).
- S2: [Liberty PharmacyOne official product page](https://libertysoftware.com/pharmacy/).
- S3: [Liberty popular features](https://libertysoftware.com/popular-features/).
- S4: [Liberty Chain Management](https://libertysoftware.com/chain/).

## Comparison matrix

| Criterion | PrimeRx Cloud | Liberty PharmacyOne | Pharmacy IS MVP |
|---|---|---|---|
| Prescription workflow | Refill scheduling and prescription benefits integration [S1] | Prescription workflows and configurable queues [S2, S3] | Manual prescriptions, partial Rx/OTC dispensing |
| Inventory | Separate inventories by medication category [S1] | Supplier support and wholesaler ordering [S2] | Batch stock, expiry checks and atomic decrement |
| Patient engagement | Patient accounts and two-way messages [S1] | Messages and patient-facing apps [S2, S3] | Own-record portal and account editing, no messaging |
| Permissions | Role-based controls listed [S1] | Central user roles in Chain Management [S4] | Tested Admin/Pharmacist/Patient checks |
| Operating model | Browser access and monthly subscription [S1] | Web central-office tools in chain offering [S4] | Local Docker demo; VPS still pending |
| en/kk/ru interface | Exact language combination not established | Exact language combination not established | All three UI dictionaries and browser switch tests |

## Derived strategy

Commercial platforms cover much broader pharmacy operations. Our educational opportunity is a small, inspectable workflow with explicit stock invariants and three course-relevant languages. We will demonstrate correctness and explain the implementation instead of claiming commercial or clinical equivalence. We defer insurance, messaging and wholesale integrations, and spend the next iteration on the admin controls required for Week 11.

## SWOT with actions

| Area | Assessment | Action |
|---|---|---|
| Strength | Explicit transaction boundaries and reproducible local seeds | Demonstrate concurrent-request tests and stock/history before and after a dispense |
| Strength | Three languages and inspectable source | Keep dictionary parity tests and request fluent-speaker review |
| Weakness | No clinical decision engine or production operations | Use fictional data and label limits; complete hosting hardening before exposure |
| Weakness | Current commits concentrate under Ehsan's identity | Assign weekly member-owned improvements, reviewed branches and individual explanations |
| Opportunity | Clear educational demonstration of relational data and access rules | Map each requirement to a diagram, test and live action |
| Threat | Integration regressions or unreliable classroom internet | Keep cached images, isolated smoke verification and a local demo runbook |
| Threat | Established platforms have extensive integrations | Keep the MVP bounded; do not promise operational replacement |

These are team design assessments. No user interviews, adoption results, market-size estimates or competitive superiority claims are asserted.
