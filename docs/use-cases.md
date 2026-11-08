# Pharmacy IS actors and use cases

Exported UML use-case diagram: [SVG](diagrams/use-cases.svg). The diagram separates implemented use cases from the planned Week 11 administration case. Roles are authorization groups, not separate account systems. Doctors are domain records, not logged-in actors in this MVP.

| ID | Actor | Goal | Result |
|---|---|---|---|
| UC01 | Patient, Pharmacist, Admin | Sign in/out | Authenticated session or denied credentials |
| UC02 | Patient | Register an account | Patient role and own linked record |
| UC03 | Patient | View own records | Only own prescriptions and dispensing history |
| UC04 | All roles | Edit own account | Updated own name/email |
| UC05 | Pharmacist, Admin | Manage patients | Validated patient record |
| UC06 | Pharmacist, Admin | Manage catalog and receive stock | Medication and batch records |
| UC07 | Pharmacist, Admin | Record prescription | Patient, doctor, dates and medication lines |
| UC08 | Pharmacist, Admin | Dispense medication | Checked quantity, stock decrement and recorded history |
| UC09 | Pharmacist, Admin | Search records | Matching patients, medications or prescriptions |
| UC10 | All roles | Change interface language | English, Kazakh or Russian labels |
| UC11 | Admin | Manage users and delete eligible records | Planned Week 11 dedicated admin interface |

## UC08 primary flow

Preconditions: authenticated Pharmacist/Admin; existing patient; active medication; received, unexpired batch. Rx medications also require an active prescription for that patient and medication.

1. Select the patient, batch, optional OTC/Rx prescription line and positive quantity.
2. Confirm dispensing in the interface.
3. The service locks the relevant prescription, line and batch within a database transaction.
4. It verifies validity, identity, remaining prescription quantity and stock.
5. It records the transaction with the unit-price snapshot and reduces stock.
6. It marks the prescription completed once every line is fully supplied.
7. The UI refreshes stock and history.

Alternative flows: wrong patient/medication, expired/not-yet-valid prescription, inactive medication, unavailable batch or excessive quantity produces a translated rejection and no stock/history change. A patient role receives an authorization denial. A network interruption requires checking history before retrying because retry idempotency is not implemented.
