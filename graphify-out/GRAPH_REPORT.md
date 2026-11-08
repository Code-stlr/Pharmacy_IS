# Graph Report - BIS_Project  (2026-11-08)

## Corpus Check
- Corpus is ~38,595 words - fits in a single context window. You may not need a graph.

## Summary
- 497 nodes · 957 edges · 29 communities (16 shown, 13 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 87 edges (avg confidence: 0.95)
- Token cost: unavailable for host-agent semantic extraction. The token counters are zero placeholders, not measured usage or a claim of zero cost. AST extraction used no LLM.

## Community Hubs (Navigation)
- Domain Models and APIs
- React Workspace and Forms
- Sessions and Patient Access
- Requirements and Task Tracking
- Local Container Services
- Weekly Evidence and Ownership
- Admin Access Safeguards
- Dispensing Workflow Tests
- Domain Integrity Tests
- Diagram and Capture Tools
- Frontend Runtime Dependencies
- TypeScript Compiler Settings
- Frontend Test Dependencies
- Admin CRUD Tests
- Browser Acceptance Workflows
- Vite and Vitest Setup
- Isolated Acceptance Containers
- Frontend Package Metadata
- API Readiness Tests
- Django App Registration
- Prescription Line Serialization
- Frontend Package Commands
- DOM Test Assertions

## God Nodes (most connected - your core abstractions)
1. `DomainTests` - 27 edges
2. `Patient` - 26 edges
3. `WorkflowTests` - 23 edges
4. `App()` - 20 edges
5. `Week 11 admin panel and redesign` - 18 edges

## Surprising Connections (you probably didn't know these)
- `Atomic Rx/OTC dispensing` --references--> `dispense()`  [EXTRACTED]
  docs/database.md → backend/pharmacy/services.py
- `React/Django/PostgreSQL architecture` --references--> `App()`  [EXTRACTED]
  docs/architecture.md → frontend/src/App.tsx
- `React HTML entry point` --conceptually_related_to--> `App()`  [INFERRED]
  frontend/index.html → frontend/src/App.tsx

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Dispensing integrity across schema and transaction** — docs_database_constraints, docs_architecture_row_locking, docs_database_dispensing, docs_diagrams_domain_erd_prescriptionline [EXTRACTED 1.00]
- **Course evidence and honest contribution tracking** — docs_task_register_authority, docs_task_register_authorship, docs_ai_usage_student_review, semester_mvp_project_plan_criteria [INFERRED 0.95]

## Communities (29 total, 13 thin omitted)

### Community 0 - "Domain Models and APIs"
Cohesion: 0.05
Nodes (53): AdminCategoryViewSet, AdminDoctorViewSet, AdminMedicationViewSet, AdminPatientViewSet, AdminResourceViewSet, AdminSupplierViewSet, BatchViewSet, CategoryViewSet (+45 more)

### Community 1 - "React Workspace and Forms"
Cohesion: 0.10
Nodes (39): React HTML entry point, AdminPanel(), changed(), remove(), api(), ApiError, RecordData, User (+31 more)

### Community 2 - "Sessions and Patient Access"
Cohesion: 0.06
Nodes (14): health(), Credentials, identity(), IdentitySerializer, LoginView, LogoutView, MeView, MyPatientView (+6 more)

### Community 3 - "Requirements and Task Tracking"
Cohesion: 0.07
Nodes (40): Pinned Django backend dependencies, AI-assisted work disclosure, Admin panel and protected deletion, Three-language interface, Role-scoped application access, Multi-entity search, Production deployment boundary, React/Django/PostgreSQL architecture (+32 more)

### Community 4 - "Local Container Services"
Cohesion: 0.07
Nodes (28): build, command, depends_on, env_file, environment, condition, environment, healthcheck (+20 more)

### Community 5 - "Weekly Evidence and Ownership"
Cohesion: 0.12
Nodes (24): Ehsan Bali: AI-assisted implementation and coordination, Human approval and contribution evidence, Current teacher report, Week 1: Topic and problem, Week 2: Actors and architecture, Week 3: Market context and wireframes, Week 4: Database design, Week 5: Authentication (+16 more)

### Community 6 - "Admin Access Safeguards"
Cohesion: 0.11
Nodes (6): AdminOnly, AdminUserSerializer, Meta, AdminUserViewSet, DomainPermission, role()

### Community 9 - "Diagram and Capture Tools"
Cohesion: 0.15
Nodes (9): out, report, root, build, diagram, out, root, out (+1 more)

### Community 10 - "Frontend Runtime Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, @emotion/styled@^11.14.0, @fontsource-variable/inter@^5.3.0, i18next@^25.0.0, @mui/material@^7.0.0, react@^19.0.0, react-dom@^19.0.0, react-i18next@^16.0.0 (+5 more)

### Community 11 - "TypeScript Compiler Settings"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, jsx, lib, module, moduleResolution, noEmit, skipLibCheck (+3 more)

### Community 12 - "Frontend Test Dependencies"
Cohesion: 0.18
Nodes (11): devDependencies, jsdom@^26.0.0, @testing-library/react@^16.0.0, @types/react@^19.0.0, @types/react-dom@^19.0.0, typescript@^5.9.0, jsdom, @testing-library/react (+3 more)

### Community 14 - "Browser Acceptance Workflows"
Cohesion: 0.22
Nodes (4): @axe-core/playwright@^4.14.0, @playwright/test@^1.65.0, @axe-core/playwright, @playwright/test

### Community 15 - "Vite and Vitest Setup"
Cohesion: 0.25
Nodes (6): vite@^7.0.0, @vitejs/plugin-react@^5.0.0, vitest@^5.1.0, vite, @vitejs/plugin-react, vitest

### Community 16 - "Isolated Acceptance Containers"
Cohesion: 0.29
Nodes (6): environment, AUTH_ANON_RATE, ports, services, backend, frontend

### Community 17 - "Frontend Package Metadata"
Cohesion: 0.29
Nodes (6): @emotion/react@^11.14.0, name, private, type, version, @emotion/react

### Community 22 - "Frontend Package Commands"
Cohesion: 0.50
Nodes (4): scripts, build, dev, test

## Ambiguous Edges - Review These
- `Admin panel and protected deletion` → `FR11 pending admin claim`  [AMBIGUOUS]
  docs/requirements.md · relation: conceptually_related_to

## Knowledge Gaps
- **23 isolated node(s):** `Pinned Django backend dependencies`, `Repeatable fictional seeds`, `Relational constraints and validation`, `ERD export and preview tooling`, `Ehsan Bali` (+18 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 188 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Atomic Rx/OTC dispensing` connect `Requirements and Task Tracking` to `Domain Models and APIs`?**
  _High betweenness centrality (0.320) - this node is a cross-community bridge._
- **Are the 9 inferred relationships involving `DomainTests` (e.g. with `Category` and `DispensingTransaction`) actually correct?**
  _`DomainTests` has 9 INFERRED edges - model-reasoned connections that need verification._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `Admin panel and protected deletion` and `FR11 pending admin claim`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
## Coverage and integrity audit

- All 25 semantic files have verified full-file coverage. The ERD was visually inspected. `.private/`, ignored build output, dependencies and local environment files were excluded.
- Ten code/config files yielded no AST symbols; CSS, Dockerfiles and some configuration formats were unclassified and not semantically extracted. This graph is a navigation aid, not proof that every runtime relationship was found.
- Graph health warning: the raw extractor reports 108 dangling-endpoint edges. Inspection found these target 46 references: external Python/Node modules and the unclassified CSS import. The builder materializes reference nodes; final graph endpoints are checked separately. These are not verified project implementations.
- Graph health warning: the default undirected simple graph collapses 14 same-endpoint relationship variants. The complete 971 raw relationships, confidence and provenance are preserved in `extraction-audit.json`; the navigation graph has 957 edges.
- Documentation inconsistency: `docs/requirements.md` FR11 still says Week 11 pending, while the application guide and task register describe completed admin CRUD. Historical weekly records also preserve earlier pending states. No source was changed by this graph build.
- Token usage is unavailable because the collaboration API does not expose model usage. No numerical model-cost estimate is claimed.
- The graph view, JSON, report and audit artifacts are shared in Git. Machine-specific interpreter/root settings, cache and incremental manifest are excluded. Source paths in shared audit files are repository-relative. Private team records are not included.

## All community cohesion scores

| Community | Cohesion |
|---|---|
| Domain Models and APIs | 0.05237171574678187 |
| React Workspace and Forms | 0.09860859044162129 |
| Sessions and Patient Access | 0.06382978723404255 |
| Requirements and Task Tracking | 0.06666666666666667 |
| Local Container Services | 0.06896551724137931 |
| Weekly Evidence and Ownership | 0.12318840579710146 |
| Admin Access Safeguards | 0.11067193675889328 |
| Dispensing Workflow Tests | 0.1568627450980392 |
| Domain Integrity Tests | 0.1503267973856209 |
| Diagram and Capture Tools | 0.15 |
| Frontend Runtime Dependencies | 0.15384615384615385 |
| TypeScript Compiler Settings | 0.16666666666666666 |
| Frontend Test Dependencies | 0.18181818181818182 |
| Admin CRUD Tests | 0.2 |
| Browser Acceptance Workflows | 0.2222222222222222 |
| Vite and Vitest Setup | 0.25 |
| Isolated Acceptance Containers | 0.2857142857142857 |
| Frontend Package Metadata | 0.2857142857142857 |
| Django Startup Configuration | 0.3333333333333333 |
| API Readiness Tests | 0.4 |
| Django App Registration | 0.5 |
| Prescription Line Serialization | 0.5 |
| Frontend Package Commands | 0.5 |
| DOM Test Assertions | 0.6666666666666666 |
| Acceptance Verification Script | 1.0 |
| Config Package Marker | 1.0 |
| Command Package Marker | 1.0 |
| Management Package Marker | 1.0 |
| Migration Package Marker | 1.0 |

## Query context benchmark

Detected corpus: 38,595 words, approximately 51,460 tokens. Average graph query response: approximately 1,778 tokens, a 28.9x smaller context on the matching sample questions. This estimates context size, not answer quality, model billing or measured semantic-extraction cost.

The HTML viewer loads vis-network from a public CDN; opening the HTML requires network access to that library unless it is already cached. JSON/report remain local and readable without it.
