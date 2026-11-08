# Semester MVP Development Plan: Basics of Information Systems (KBTU)

This realistic, 15-week sprint plan maps directly to the **Course Syllabus**, the **Weekly Project Status Check** framework, and the **Final Examination Marking Rubric** (Presentation: 15 pts, Live Demonstration: 25 pts).

---

## 🎯 Target Definition of Done (Week 15 / Final Exam)

To secure maximum points (40/40) during the final examination and pass continuous attestations, the MVP must satisfy:
1. **Live Demonstration (25 pts):**
   - **> 5 Distinct Functionalities (10 pts):** e.g., Authentication/RBAC, User Profile, Core Transaction/Booking/Order flow, Notification/Status Tracking, Messaging/Reporting.
   - **Multilanguage Support (5 pts):** Dynamic switching between English and Kazakh or Russian across UI elements.
   - **Search Functionality (5 pts):** Searchable interface across 2–3 entity types (e.g., items, users, categories/orders).
   - **Admin Panel (5 pts):** Role-based access control (RBAC), full CRUD operations on core data models.
   - **Offline/Local Resilience:** Prepared local database seed/offline demo data in case of internet instability.
2. **Technical & Business Presentation (15 pts):**
   - 1-sentence measurable aim & 3–5 verifiable objectives.
   - Competitive analysis (2–3 real competitors with named criteria) & SWOT analysis with actionable conclusions.
   - UML Use-Case Diagram ($\ge 3$ actors, $\ge 5$ use cases).
   - ER Diagram ($\ge 5$ relational entities with explicit Primary and Foreign Keys).
3. **Weekly Status Rules:**
   - "A promise is not progress." Every student must show a personal, measurable technical or documentation artifact each week.

---

## 📅 Week-by-Week Implementation Schedule

### Phase 1: Initiation, Requirements & Architecture (Weeks 1–3)
*Aligns with Syllabus: Intro to IS, Components of IS, IS for Strategic Advantage.*

#### **Week 1: Topic Selection & Problem Definition**
* **Syllabus Context:** Course kickoff, team formation, SIS 1.
* **Team Objective:** Select an approved topic (from the 30 topics in the exam guide) and register it with the instructor.
* **Weekly Deliverables:**
  - Written 1-sentence **Project Aim** (specific, measurable).
  - Draft of **3–5 Verifiable Objectives**.
  - Initial team role assignments: Full-stack Developer, Database/Backend Lead, UI/UX & Frontend Lead, QA/Business Analyst.
* **Weekly Check Evidence:** Topic registration confirmation + Markdown document containing the problem statement and team roles.

#### **Week 2: User Roles, Process Flow & Use-Case Modeling**
* **Syllabus Context:** Components of IS, SIS 2.
* **Team Objective:** Establish system actors and initial architecture.
* **Weekly Deliverables:**
  - Identification of at least **3 distinct actors** (e.g., *Guest/Visitor*, *Registered User/Client*, *System Administrator*).
  - Identification of **$\ge 5$ core use cases** across actors.
  - Initial **UML Use-Case Diagram** (draft meeting exam requirement #6).
  - Setup of Git repository and tech stack agreement (e.g., React/Vue/HTML+JS frontend, Node.js/Python/Go/Spring backend, PostgreSQL/MySQL database).
* **Weekly Check Evidence:** Working Git repository with `README.md` and export of the Use-Case diagram.

#### **Week 3: Strategic & Market Context (Competitive & SWOT Analysis)**
* **Syllabus Context:** IS for Strategic Advantage, SIS 3.
* **Team Objective:** Complete strategic documentation while developers set up the local development environment.
* **Weekly Deliverables:**
  - **Competitive Analysis Matrix:** 2–3 real market solutions evaluated against at least 4 named criteria.
  - **SWOT Analysis:** Strengths, Weaknesses, Opportunities, Threats, followed by a concrete product strategy decision.
  - Wireframe / low-fidelity mockups of the 3 primary user screens.
* **Weekly Check Evidence:** Slide draft covering Exam Presentation Items #2, #3, #4, and #5.

---

### Phase 2: Database Schema & Core Foundation (Weeks 4–7)
*Aligns with Syllabus: Hardware, Software, Data Resource Management (Governance).*

#### **Week 4: Entity-Relationship Design (5+ Entities)**
* **Syllabus Context:** Computer Hardware: Architecture & Sizing, SIS 4.
* **Team Objective:** Design the normalized relational database satisfying the exam threshold.
* **Weekly Deliverables:**
  - **ER Diagram:** Minimum 5 connected entities (e.g., `Users`, `Roles`, `Items/Products`, `Transactions/Orders`, `AuditLogs/Reviews`).
  - Explicit definition of **Primary Keys (PK)**, **Foreign Keys (FK)**, and relationship cardinalities ($1:1$, $1:N$, $N:M$).
  - Initialization of local database schema migration scripts or ORM models.
* **Weekly Check Evidence:** Visual ER diagram artifact + SQL DDL script or ORM model code in Git.

#### **Week 5: Authentication & Role-Based Foundations**
* **Syllabus Context:** Computer Hardware & Peripherals, SIS 5.
* **Team Objective:** Build the system backbone: user management and security baseline.
* **Weekly Deliverables:**
  - Implementation of **Functionality 1: User Registration, Login, and Session/JWT Handling**.
  - Role verification middleware (checking if a user is regular *User* vs. *Admin*).
  - Frontend authentication forms (Login/Signup) linked to the API.
* **Weekly Check Evidence:** Live demo showing a new user account created, hashed in the database, and authenticated with appropriate role redirect.

#### **Week 6: The "Walking Skeleton" (End-to-End Primary Flow)**
* **Syllabus Context:** Computer Software, SIS 6.
* **Team Objective:** Connect frontend, backend, and database for the single most important action of the app.
* **Weekly Deliverables:**
  - Implementation of **Functionality 2: Core Business Transaction**.
    - *Example (Shop/Marketplace):* User views an item, clicks create/order, item enters pending state in database.
    - *Example (Booking/Clinic):* User selects slot, confirms booking, record persists in DB.
  - Seed database with realistic mock data for local demonstration.
* **Weekly Check Evidence:** Working vertical slice: a user performs an action on UI, and data updates live in the database.

#### **Week 7: Attestation 1 & Data Governance/Quality Review**
* **Syllabus Context:** Data Resource Management: Governance & Quality, SIS 7, **1st Intermediate Attestation (30 pts)**.
* **Team Objective:** Pass Attestation 1 with verified working foundation and data validation rules.
* **Weekly Deliverables:**
  - Input validation implemented on backend and frontend (sanitizing inputs, handling missing data).
  - Implementation of **Functionality 3: User Profile & Account Data Management** (view/edit personal details, view history).
  - Attestation milestone defense preparation.
* **Weekly Check Evidence:** Live demonstration of Features 1–3 and schema validation rules to the instructor.

---

### Phase 3: Midterm & Core Feature Expansion (Weeks 8–10)
*Aligns with Syllabus: Responsible AI, Midterm Exam, Databases, Telecommunications.*

#### **Week 8: Midterm Week & Mid-Sprint Code Cleanup**
* **Syllabus Context:** Responsible Use of AI, **Midterm Exam (covers theory)**.
* **Team Objective:** Maintain project momentum without burning out during Midterm testing.
* **Weekly Deliverables:**
  - Address technical debt, code formatting, and Git branch cleanups.
  - If using AI coding tools: Document AI usage according to KBTU Academic Policy (Level B / verified and tested by students; document what was generated vs. reviewed).
  - Finalize all slide requirements for presentation items #1 through #7.
* **Weekly Check Evidence:** Clean git log, updated project status board (On Track / At Risk).

#### **Week 9: Multi-Entity Search Implementation**
* **Syllabus Context:** Data Resource Management (Databases), SIS 8.
* **Team Objective:** Complete the mandatory Search functionality (Exam Demonstration Item #3, 5 pts).
* **Weekly Deliverables:**
  - Build **Search Functionality** querying across **2–3 entity types** (e.g., search items by keyword, users by username/email, orders by status/ID).
  - Dedicated search interface with responsive filtering and empty-state handling.
* **Weekly Check Evidence:** Live screen showing accurate search queries across distinct database models.

#### **Week 10: Multilanguage (i18n) Architecture**
* **Syllabus Context:** Telecommunications & Networks, SIS 9.
* **Team Objective:** Implement full UI localization (Exam Demonstration Item #2, 5 pts).
* **Weekly Deliverables:**
  - Implement language switcher supporting at least **English + Kazakh** (or Russian).
  - Externalize all UI text strings into structured dictionary files (`en.json`, `kk.json`).
  - Verify that state transitions, search labels, navbar, and error dialogs switch languages cleanly without page breaks.
* **Weekly Check Evidence:** Live toggle between languages across all existing screens.

---

### Phase 4: Admin Controls & Advanced Features (Weeks 11–13)
*Aligns with Syllabus: Security Foundations, Threats & Privacy, Emerging Tech.*

#### **Week 11: Dedicated Admin Panel (CRUD Operations)**
* **Syllabus Context:** Security Foundations: Risk & Controls, SIS 10.
* **Team Objective:** Build the Admin Panel (Exam Demonstration Item #4, 5 pts).
* **Weekly Deliverables:**
  - Dedicated route `/admin` strictly blocked for non-admin tokens.
  - **CRUD Interface:** Admin can Create, Read, Update, and Delete key records (e.g., manage registered users, manage catalog items, override statuses).
  - Confirmation modals for destructive actions (e.g., "Delete record").
* **Weekly Check Evidence:** Live demo of an admin logging in, editing an existing database entry, deleting a record, and demonstrating that a regular user cannot access `/admin`.

#### **Week 12: Completing Functionalities 4 & 5+ (Meeting the >5 Features Threshold)**
* **Syllabus Context:** Security & Ethical Challenges, SIS 11.
* **Team Objective:** Exceed the minimum 5 working functionalities (Exam Demonstration Item #1, 10 pts).
* **Weekly Deliverables:**
  - Implementation of **Functionality 4: Status Notifications or Activity Logs** (e.g., toast alerts, status update history).
  - Implementation of **Functionality 5: File Upload or Export/Reporting** (e.g., avatar upload, PDF receipt download, or CSV export for admin).
  - Security pass: Ensure passwords remain hashed, endpoints validate authorization, and SQL injection/XSS vectors are prevented.
* **Weekly Check Evidence:** Full feature inventory review proving $>5$ working, demonstrable functions.

#### **Week 13: Emerging Tech Polish & Edge-Case Handling**
* **Syllabus Context:** Emerging Technologies in IS, SIS 12.
* **Team Objective:** Add finishing functional touches (e.g., AI assistant widget, basic analytics chart for admin).
* **Weekly Deliverables:**
  - Polish UI consistency (spacing, typography, loading spinners, intuitive error alerts).
  - Implement edge-case checks: empty inputs, duplicate entries, network failure fallback messages.
* **Weekly Check Evidence:** Demonstration of error handling (trying to submit empty forms, invalid emails, or wrong passwords).

---

### Phase 5: Stabilization, Endterm & Final Defense (Weeks 14–17)
*Aligns with Syllabus: Developing IT Strategies, Reflection, Endterm, Final Exam.*

#### **Week 14: End-to-End Testing & Offline Seed Backup**
* **Syllabus Context:** Developing Business/IT Strategies, SIS 13.
* **Team Objective:** Bulletproof the system against live demo failures.
* **Weekly Deliverables:**
  - Full smoke test covering all user journeys from registration to admin inspection.
  - Prepare an **offline/local demo seed**: ensure SQLite/local PostgreSQL and seed scripts allow running the entire app locally without campus Wi-Fi dependencies.
  - Verification of individual student contributions and commit histories.
* **Weekly Check Evidence:** Complete dry run of the app running completely disconnected from external internet.

#### **Week 15: Endterm Exam & Final Presentation Polish**
* **Syllabus Context:** Course Reflection and Problem Solving, **2nd Intermediate Attestation & Endterm Exam**.
* **Team Objective:** Lock code, finalize slides, and complete internal team defense rehearsal.
* **Weekly Deliverables:**
  - Final 15-point slide deck completed:
    1. Approved Project Topic
    2. Measurable Aim (1 sentence)
    3. 3–5 Verifiable Objectives
    4. Competitive Analysis (2–3 real competitors with criteria)
    5. SWOT Analysis with derived decision
    6. UML Use-Case Diagram ($\ge 3$ actors, $\ge 5$ use cases)
    7. ER Diagram ($\ge 5$ entities, PK/FK marked)
  - Code freeze: No new experimental features, only bug fixes.
* **Weekly Check Evidence:** Full presentation rehearsal meeting time limits with each member answering their individual questions.

#### **Weeks 16–17: Final Examination Defense (40 Points)**
* **Syllabus Context:** Final Examination Period (180 minutes session).
* **Execution:**
  - **Part 1 (Presentation - 15 pts):** Deliver slides systematically covering items 1–7.
  - **Part 2 (Live Demonstration - 25 pts):**
    1. Show $>5$ working features (10 pts).
    2. Toggle between English and Kazakh/Russian (5 pts).
    3. Execute multi-entity search live (5 pts).
    4. Log into Admin panel and perform CRUD actions (5 pts).
  - **Individual Q&A Defense:** Every student demonstrates personal mastery of their technical code and architecture choices.

---

## 👥 Role Responsibility Matrix & Deliverables

| Role | Primary Semester Deliverables | What to Show at Weekly Check | Exam Individual Defense Focus |
| :--- | :--- | :--- | :--- |
| **Backend & Database Lead** | ER Diagram (5+ entities), REST/GraphQL API, DB migrations, Auth/RBAC, Search queries. | Postman/cURL runs, DB table structure, schema migrations, API routes. | Explains database relationships, keys, normalization, query efficiency, and security controls. |
| **Frontend & UI/UX Lead** | Responsive UI, Localization (i18n switcher), Admin Panel views, Forms with validation. | Working frontend components, translation JSON files, reactive UI state. | Explains user flow, component architecture, state management, and usability decisions. |
| **QA, Data & Logic Engineer** | Test cases, Seed data generation, Error handling validation, Edge-case logs. | Test run logs, documented defect fixes, offline seed dataset. | Explains test coverage, how edge cases are caught, and data validation rules. |
| **System Analyst / Product PM** | Aim/Objectives, Competitive matrix, SWOT analysis, Use-Case diagram, Slide deck coordination. | Updated diagrams, verified requirements documentation, progress tracking board. | Explains business rationale, competitor trade-offs, scope management, and system architecture. |

---

## 📋 Weekly Preparation Checklist (Use for Every Class)

Before entering the weekly practical session, check off the following items:
- [ ] **Visible Result:** We have a working feature, database change, or diagram to demonstrate (no slides-only promises).
- [ ] **Individual Ownership:** Every team member can explain their direct code or documentation contribution.
- [ ] **Status Clear:** We know whether we are *On Track*, *At Risk*, or *Blocked*, and have an escalation plan.
- [ ] **Next Task Defined:** Every member has 1 measurable task with a deadline for next week.
- [ ] **Exam Rubric Alignment:** Current work directly supports one of the 7 Presentation items or 4 Demo criteria.