# Pharmacy IS relational model

The Mermaid ER diagram below corresponds to the initial Django migration. Every entity uses `id` as its PK. Django's authentication tables are represented by User; its existing groups and permissions are omitted for readability.

```mermaid
erDiagram
    Category ||--o{ Medication : categorizes
    Medication ||--o{ DrugBatch : stocked_as
    Supplier ||--o{ DrugBatch : supplies
    User o|--o| Patient : optional_account
    Patient ||--o{ Prescription : receives
    Doctor ||--o{ Prescription : issues
    Prescription ||--o{ PrescriptionLine : contains
    Medication ||--o{ PrescriptionLine : prescribed
    Patient ||--o{ DispensingTransaction : receives
    User ||--o{ DispensingTransaction : records
    DrugBatch ||--o{ DispensingTransaction : dispensed_from
    PrescriptionLine o|--o{ DispensingTransaction : authorizes
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
        bigint user_id FK,UK
        string full_name
        date date_of_birth
        string phone
        text allergy_notes
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
        bigint pharmacist_id FK
        bigint batch_id FK
        bigint prescription_line_id FK
        int quantity
        decimal unit_price
        datetime dispensed_at
    }
```

Composite unique keys: Medication(name, strength, dosage_form), DrugBatch(medication_id, lot_number), PrescriptionLine(prescription_id, medication_id). A prescription may have zero lines while being drafted; the later dispensing workflow must reject empty prescriptions.
