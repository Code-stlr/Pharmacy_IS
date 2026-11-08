# Task 9 Database Check for Your Project
**Week 9 · Basics of Information Systems**

**Purpose:** Show how the database supports one main action in your team information system. Your team may show finished work, unfinished work, and one real problem with a practical next step.

---

## What Your Team Must Prepare

* One main action, such as placing an order, booking a service, registering for a course, or reporting a problem.
* At least three connected database tables with at least four fields in each table.
* A primary key for every table and at least one foreign key.
* An ERD that labels 1:1, 1:M, or M:N relationships. Use a bridge table for every many-to-many relationship.
* Data types and at least two useful rules, such as required, unique, valid range, or valid foreign key.
* One simple SELECT query and a clear explanation of the information it returns.
* One example of data becoming information and supporting a business decision.
* One database risk or design problem and a realistic plan to improve it.

---

## Shared Database Plan

| Table | Purpose | Important fields | Primary key | Foreign key | Rules and data types |
| :--- | :--- | :--- | :--- | :--- | :--- |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |

*Insert your ERD below this table. The diagram must match the tables and keys above.*

---

## What Each Student Explains Orally

* **Student 1 — Main action and tables:** Explain the main action, the data collected, why each table exists, and what was difficult when the team divided data into tables.
* **Student 2 — Primary keys and data rules:** Show the primary key in every table. Explain why each key is unique and stable. Give one example of a rule that prevents wrong or missing data.
* **Student 3 — Foreign keys and relationships:** Show how the tables connect. Name each relationship type. Explain how the system prevents an orphan record.
* **Student 4 — ERD and repeated data:** Explain the ERD. Identify repeated data and show how the design stores one fact in one correct place.
* **Student 5 — SQL and business use:** Explain one SELECT query, the information it returns, and one decision a manager or user can make from that information.
* **Student 6 — Security and transactions:** Explain who may access sensitive data. Give one multi-step transaction and explain what the system should do if one step fails.

*(Team with five students: Student 5 also explains access to sensitive data and one transaction.)*

### Every Student Must Also Say:
1. *“My personal contribution was ...”*
2. *“One database decision I helped make was ... because ...”*
3. *“One part that is still unfinished or unclear is ...”*
4. *“Our next action is ... and ... is responsible for it.”*

---

## Problem and Next Action

| Current problem | Why it matters | Proposed solution | Responsible student | Deadline |
| :--- | :--- | :--- | :--- | :--- |
| | | | | |

---

## Submission and Speaking Rules

* Submit one file per team named `TeamName_ProjectName_Task09.docx`.
* Include all names and student IDs, the table plan, ERD, query, problem table, and assigned roles.
* Each student speaks for about two minutes. The teacher may ask one extra question.
* Do not read a prepared paragraph. Point to your own diagram, tables, fields, and query while explaining.
* It is acceptable to say that a part is unfinished if you can explain the problem and a reasonable next step.

---

## Marking Policy (3 Points)

| Category | Points |
| :--- | :---: |
| **TEAM** — Tables, fields, data types, and validation rules | 0.40 |
| **TEAM** — Primary keys and foreign keys | 0.35 |
| **TEAM** — ERD and relationships match the business rules | 0.35 |
| **TEAM** — SQL query, correct result, and business decision | 0.40 |
| **INDIVIDUAL** — Oral explanation and follow-up answers | 0.60 |
| **INDIVIDUAL** — Personal contribution | 0.40 |
| **INDIVIDUAL** — Problem, solution, responsible person, and next action | 0.50 |
| **Total** | **3.00** |

---

## Teacher Checking Guide

*Strong evidence: Students show their own project objects and explain why the design works. Definitions alone are not enough.*

| Check | What a strong answer sounds like | Warning sign |
| :--- | :--- | :--- |
| **Tables** | Each table represents one clear thing or event. | One giant table, unclear table purpose, repeated groups. |
| **Primary keys** | Every table has a unique, never-empty, stable key. | Name, phone, or changeable email used without justification. |
| **Foreign keys** | The FK points to an existing PK with the same meaning and compatible type. | FK has no parent table or creates orphan records. |
| **Relationships** | 1:1, 1:M, and M:N labels agree with the business rules. | Direct M:N link without a bridge table. |
| **Normalization** | One fact has one main home and updates happen once. | Customer or product details copied into many rows. |
| **Data quality** | Required fields, data types, uniqueness, ranges, and valid references are explained. | All fields accept any value or important data can be empty. |
| **SQL and decision** | The query answers a useful project question and supports an action. | Query does not match the tables or returns data with no purpose. |
| **Security** | Roles receive only the data they need. | Every user can see or change every table. |
| **Transaction** | A multi-step action completes fully or rolls back. | Payment, booking, or stock changes can remain half-finished. |

### Fast Teacher Questions
* Show me one record that connects two of your tables.
* What stops two rows from using the same primary key?
* What happens if this foreign key does not exist in the parent table?
* Which fact is repeated now, and where should it live?
* What exact question does your SELECT query answer?
* Which user should not see this field?
* If step two fails, which earlier change must the transaction undo?
* What did you personally change in this database design?
