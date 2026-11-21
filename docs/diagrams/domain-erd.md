# Pharmacy IS relational model

The Mermaid ER diagram shows the application’s branch, patient and inventory relationships. Every entity uses `id` as its PK. User represents Django accounts.

```mermaid
erDiagram
    Category ||--o{ Medication : categorizes
    Branch ||--o{ DrugBatch : holds
    Branch ||--o{ UserBranch : assigns
    User ||--o| UserBranch : has
    Branch o|--o{ Patient : preferred_by
    Medication ||--o{ DrugBatch : stocked_as
    Supplier ||--o{ DrugBatch : supplies
    User o|--o| Patient : optional_account
    Patient }o--o{ Allergy : has
    Patient ||--o{ Prescription : receives
    Doctor ||--o{ Prescription : issues
    Prescription ||--o{ PrescriptionLine : contains
    Medication ||--o{ PrescriptionLine : prescribed
    Patient ||--o{ DispensingTransaction : receives
    User ||--o{ DispensingTransaction : records
    DrugBatch ||--o{ DispensingTransaction : dispensed_from
    PrescriptionLine o|--o{ DispensingTransaction : authorizes
    Branch ||--o{ PatientAccessLog : context_for
    Patient o|--o{ PatientAccessLog : audited
    User o|--o{ PatientAccessLog : acts
    Branch {
        bigint id PK
        string code UK
        string name
        boolean is_active
    }
    UserBranch {
        bigint id PK
        int user_id FK,UK
        bigint branch_id FK
    }
    Category {
        bigint id PK
        string name UK
    }
    Medication {
        bigint id PK
        bigint category_id FK
        string name
        string active_ingredient
        string strength
        string dosage_form
        string unit
        boolean requires_prescription
        boolean is_active
    }
    Supplier {
        bigint id PK
        string name UK
        string phone
    }
    DrugBatch {
        bigint id PK
        bigint branch_id FK
        bigint medication_id FK
        bigint supplier_id FK
        string lot_number
        date received_on
        date expires_on
        int stock_quantity
        decimal unit_price
    }
    Patient {
        bigint id PK
        string reference UK
        int user_id FK,UK
        bigint preferred_branch_id FK
        string full_name
        date date_of_birth
        string phone
        text allergy_notes
    }
    Allergy {
        bigint id PK
        string name UK
        string ingredient_keyword
    }
    Doctor {
        bigint id PK
        string full_name
        string license_number UK
    }
    Prescription {
        bigint id PK
        string reference UK
        bigint patient_id FK
        bigint doctor_id FK
        date issued_on
        date valid_until
        string status
    }
    PrescriptionLine {
        bigint id PK
        bigint prescription_id FK
        bigint medication_id FK
        int quantity_prescribed
        text directions
    }
    User {
        int id PK
        string username UK
    }
    DispensingTransaction {
        bigint id PK
        string reference UK
        bigint patient_id FK
        int pharmacist_id FK
        bigint batch_id FK
        bigint prescription_line_id FK
        int quantity
        decimal unit_price
        datetime dispensed_at
    }
    PatientAccessLog {
        bigint id PK
        bigint branch_id FK
        bigint patient_id FK
        int actor_id FK
        string action
        datetime timestamp
    }
```

Composite unique keys: Medication(name, strength, dosage_form), DrugBatch(branch_id, medication_id, lot_number), and PrescriptionLine(prescription_id, medication_id). Each dispensing location is derived from the referenced batch.
