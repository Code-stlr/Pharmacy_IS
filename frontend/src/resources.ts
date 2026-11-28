export type Field = {
  name: string;
  type?: string;
  relation?: string;
  optional?: boolean;
  multiple?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: string;
};
export const resources: Record<string, Field[]> = {
  users: [
    { name: "username" },
    { name: "first_name", optional: true },
    { name: "last_name", optional: true },
    { name: "email", type: "email", optional: true },
    { name: "role", options: ["Patient", "Pharmacist", "Admin"] },
    { name: "patient", relation: "patients", optional: true },
    { name: "branch", relation: "branches", optional: true },
    { name: "is_active", type: "boolean" },
    { name: "password", type: "password" },
  ],
  branches: [
    { name: "name" }, { name: "code" }, { name: "address", optional: true },
    { name: "latitude", type: "decimal", optional: true, min: -90, max: 90, step: "0.000001" },
    { name: "longitude", type: "decimal", optional: true, min: -180, max: 180, step: "0.000001" },
    { name: "is_active", type: "boolean" },
  ],
  branchPreference: [{ name: "preferred_branch", relation: "branches", optional: true }],
  patients: [
    { name: "reference" },
    { name: "full_name" },
    { name: "date_of_birth", type: "date" },
    { name: "phone", optional: true },
    { name: "preferred_branch", relation: "branches", optional: true },
    { name: "allergies", relation: "allergies", multiple: true, optional: true },
    { name: "allergy_notes", optional: true },
  ],
  allergies: [{ name: "name" }, { name: "ingredient_keyword", optional: true }],
  categories: [{ name: "name" }],
  suppliers: [{ name: "name" }, { name: "phone", optional: true }],
  doctors: [{ name: "full_name" }, { name: "license_number" }],
  medications: [
    { name: "name" },
    { name: "category", relation: "categories" },
    { name: "active_ingredient" },
    { name: "strength" },
    { name: "dosage_form" },
    { name: "unit" },
    { name: "requires_prescription", type: "boolean" },
    { name: "is_active", type: "boolean" },
  ],
  batches: [
    { name: "medication", relation: "medications" },
    { name: "supplier", relation: "suppliers" },
    { name: "lot_number" },
    { name: "received_on", type: "date" },
    { name: "expires_on", type: "date" },
    { name: "stock_quantity", type: "number" },
    { name: "unit_price", type: "decimal" },
  ],
  prescriptions: [
    { name: "reference" },
    { name: "patient", relation: "patients" },
    { name: "doctor", relation: "doctors" },
    { name: "issued_on", type: "date" },
    { name: "valid_until", type: "date" },
  ],
  dispense: [
    { name: "patient", relation: "patients" },
    { name: "batch", relation: "batches" },
    { name: "prescription_line", relation: "lines", optional: true },
    { name: "quantity", type: "number" },
  ],
  profile: [
    { name: "first_name", optional: true },
    { name: "last_name", optional: true },
    { name: "email", type: "email", optional: true },
  ],
};
