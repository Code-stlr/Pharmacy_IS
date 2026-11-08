# Pharmacy IS requirements and measurable objectives

Recorded 2026-11-08. Educational MVP with fictional data. Governing criteria: root semester plan. Instructor topic-registration confirmation is not present in this repository and remains a team action.

## Problem statement

A pharmacy workflow needs to connect patient identity, prescription quantities, stock by batch and dispensing history. Disconnected records make it difficult to demonstrate that a dispense used the correct prescription and reduced inventory consistently. This is our design problem, not a measured finding from interviews with a real pharmacy.

## Measurable aim

Build and demonstrate by Week 15 a three-language pharmacy web application that lets authorized staff record prescriptions and dispense medication with atomic stock updates, while patients can access only their own records, with every critical acceptance scenario passing.

## Five verifiable objectives

1. Implement Admin, Pharmacist and Patient access rules and demonstrate denied unauthorized access and patient isolation.
2. Store at least five related entities with explicit PK/FK relationships and reproducible PostgreSQL migrations and fictional seeds.
3. Demonstrate Rx and OTC dispensing, stock decrement and history creation, including rejection of invalid dates, wrong patients, excessive prescription quantities and insufficient stock.
4. Provide patient/account management and search across patients, medications and prescriptions, with English, Kazakh and Russian interface dictionaries.
5. Produce the course diagrams, competitor matrix, actionable SWOT, weekly evidence and presentation, and pass a repeatable local demonstration before hosting the MVP.

## Functional acceptance criteria

| ID | Requirement | Acceptance evidence |
|---|---|---|
| FR01 | Register, sign in and sign out | Hashed password, CSRF-protected login, session invalidated on logout |
| FR02 | Role and record authorization | Anonymous/unassigned users denied; patients cannot read others or dispense |
| FR03 | Patient records | Staff create/edit fictional demographics; future birth date rejected |
| FR04 | Inventory | Staff create categories, suppliers, medications and dated batches; price/quantity constraints enforced |
| FR05 | Prescriptions | Staff create nonempty medication lines with unique reference and validity dates |
| FR06 | Dispensing | Valid Rx/OTC flow writes a transaction and decrements stock in one transaction |
| FR07 | Failure and concurrency | Rejected operation changes no stock/history; simultaneous requests cannot oversell or exceed authorization |
| FR08 | Profile and history | User edits own account; patient reads own prescription and dispensing history |
| FR09 | Search | Positive and empty-result searches across patients, medications and prescriptions |
| FR10 | Localization | All application-owned UI labels and error summaries switch among en/kk/ru |
| FR11 | Dedicated admin panel | Week 11 pending: admin-only route, user/catalog CRUD and destructive confirmation |

## Nonfunctional acceptance criteria

- PostgreSQL migrations and seed commands work against a new isolated database.
- Local demonstration works with public network requests blocked after dependencies/images are cached.
- No real patient data, stored browser passwords or public role-escalation path.
- Mobile layouts remain usable at 390px. Automated accessibility checks supplement keyboard review.
- Technical test evidence and actual completion dates remain available in Git.

## Scope boundaries

This is an educational prototype. Allergy notes do not provide automated clinical screening. Billing, insurance, e-prescribing, refills, returns and clinical certification are outside this scope. VPS production hardening remains Phase 9. A course phase number is not a course week.
