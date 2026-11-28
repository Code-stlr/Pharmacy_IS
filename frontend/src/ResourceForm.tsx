import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { api, ApiError, type Branch, type RecordData } from "./api";
import { resources, type Field } from "./resources";
import BranchSelect from "./BranchSelect";

export default function ResourceForm({
  resource,
  record,
  data,
  activeBranch,
  callApi = api,
  admin = false,
  onClose,
  onSave,
  onAllergyAdded,
}: {
  resource: string;
  record?: RecordData;
  data: Record<string, RecordData[]>;
  activeBranch?: Branch | null;
  callApi?: typeof api;
  admin?: boolean;
  onClose: () => void;
  onSave: (values: Record<string, any>) => Promise<void>;
  onAllergyAdded?: () => void;
}) {
  const { t } = useTranslation();
  const schema = resources[resource] || [];
  const [values, setValues] = useState<Record<string, any>>(
    record
      ? { ...record }
      : Object.fromEntries(
          schema.map((field) => [
            field.name,
            field.type === "boolean"
              ? true
              : field.multiple
                ? []
                : field.options?.[0] || "",
          ]),
        ),
  );
  const [lines, setLines] = useState<Record<string, any>[]>([
    { medication: "", quantity_prescribed: 1, directions: "" },
  ]);
  const [addingAllergy, setAddingAllergy] = useState(false);
  const [addedAllergies, setAddedAllergies] = useState<RecordData[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [errorFields, setErrorFields] = useState<string[]>([]),
    [confirm, setConfirm] = useState(false);
  const patientId = resource === "patients" ? record?.id : undefined;
  const [patientRecord, setPatientRecord] = useState<RecordData | null>(null);
  const ready = patientId === undefined || patientRecord !== null;
  useEffect(() => {
    if (patientId === undefined) return;
    let active = true;
    callApi((admin ? "admin/" : "") + `patients/${patientId}/`)
      .then((patient) => {
        if (active) {
          setValues(patient);
          setPatientRecord(patient);
        }
      })
      .catch((reason) => {
        if (active) setError(reason instanceof ApiError ? reason.code : "error");
      });
    return () => { active = false; };
  }, [admin, callApi, patientId]);
  const fields = schema.filter((field) => {
    if (resource !== "users") return true;
    if (field.name === "patient") return !record?.patient && values.role === "Patient";
    if (field.name === "branch")
      return values.role === "Pharmacist" || (values.role === "Patient" && Boolean(values.patient));
    return true;
  });
  const lineOptions = (data.prescriptions || [])
    .filter(
      (p) => p.patient === Number(values.patient) && p.status === "active",
    )
    .flatMap((p) =>
      p.lines
        .filter((l: RecordData) => l.remaining > 0)
        .map((l: RecordData) => ({
          ...l,
          name:
            p.reference +
            " · " +
            l.medication_name +
            " · " +
            t("remaining") +
            ": " +
            l.remaining,
        })),
    );
  function label(item: RecordData) {
    return (
      item.name ||
      item.full_name ||
      item.reference ||
      item.medication_name ||
      item.id
    );
  }
  function field(
    field: Field,
    form: Record<string, any>,
    update: (key: string, value: any) => void,
  ) {
    if (field.name === "preferred_branch") return <BranchSelect key={field.name} branches={(data.branches || []) as Branch[]} value={form[field.name] ?? ""} onChange={(value) => update(field.name, value)} disabled={busy || !ready} />;
    const related = data[field.relation || ""] || [];
    let options = field.relation === "lines" ? lineOptions : related;
    if (field.relation === "allergies") {
      options = [
        ...related,
        ...addedAllergies.filter((item) => !related.some((existing) => existing.id === item.id)),
      ];
    }
    const select = Boolean(
      field.relation || field.options || field.type === "boolean",
    );
    const optional =
      (field.optional || (field.name === "password" && Boolean(record))) &&
      !(field.name === "branch" && values.role === "Pharmacist");
    const preferredBranch =
      field.name === "preferred_branch" || (field.name === "branch" && values.role === "Patient");
    const unavailableBranch =
      field.relation === "branches" &&
      form[field.name] &&
      !options.some((option) => option.id === form[field.name]);
    let help: string | undefined;
    if (preferredBranch) help = "preferredBranchHelp";
    if (field.name === "patient" && resource === "users") help = "linkPatientHelp";
    if (field.name === "allergy_notes") help = "allergyNotesHelp";
    if (resource === "allergies" && field.name === "ingredient_keyword") help = "allergyKeywordHelp";
    return (
      <TextField
        key={field.name}
        fullWidth
        label={t(preferredBranch ? "preferred_branch" : field.name)}
        required={!optional}
        value={
          field.multiple
            ? (form[field.name] ?? [])
            : field.type === "boolean"
            ? String(form[field.name] ?? true)
            : (form[field.name] ?? "")
        }
        select={select}
        type={
          select
            ? undefined
            : ["number", "decimal"].includes(field.type || "")
              ? "number"
              : field.type || "text"
        }
        error={errorFields.includes(field.name)}
        helperText={help ? t(help) : undefined}
        autoComplete={field.name === "password" ? "new-password" : "off"}
        slotProps={{
          inputLabel: { shrink: true },
          select: field.multiple ? { multiple: true } : undefined,
          htmlInput: {
            min: field.min ?? (field.name === "stock_quantity" ? 0 : 1),
            max: field.max,
            step: field.step ?? (field.type === "decimal" ? "0.01" : undefined),
          },
        }}
        onChange={(event) =>
          update(
            field.name,
            field.multiple
              ? ((event.target.value as unknown) as number[]).map(Number)
              : field.type === "boolean"
              ? event.target.value === "true"
              : field.options
                ? event.target.value
                : field.relation ||
                    ["number", "decimal"].includes(field.type || "")
                  ? event.target.value === ""
                    ? ""
                    : Number(event.target.value)
                  : event.target.value,
          )
        }
      >
        {select &&
          (field.type === "boolean"
            ? [
                <MenuItem key="true" value="true">
                  {t("yes")}
                </MenuItem>,
                <MenuItem key="false" value="false">
                  {t("no")}
                </MenuItem>,
              ]
            : field.options
              ? field.options.map((value) => (
                  <MenuItem key={value} value={value}>
                    {t(value)}
                  </MenuItem>
                ))
              : [
                  ...(field.multiple
                    ? []
                    : [
                        <MenuItem key="none" value="">
                          {t("none")}
                        </MenuItem>,
                      ]),
                  ...(unavailableBranch
                    ? [
                        <MenuItem key="inactive" value={form[field.name]} disabled>
                          {t("inactiveBranch")}
                        </MenuItem>,
                      ]
                    : []),
                  ...options.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {label(item)}
                      {item.strength ? " · " + item.strength : ""}
                      {item.lot_number
                        ? " · " + item.lot_number + " · " + item.stock_quantity
                        : ""}
                    </MenuItem>
                  )),
                ])}
      </TextField>
    );
  }
  async function addAllergy(draft: Record<string, any>) {
    const allergy: RecordData = await callApi("allergies/", "POST", draft);
    setAddedAllergies((current) => [...current, allergy]);
    setValues((current) => ({
      ...current,
      allergies: [...(current.allergies ?? []), allergy.id],
    }));
    onAllergyAdded?.();
  }
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const result = { ...values };
      delete result.id;
      if (resource === "prescriptions") result.lines = lines;
      if (resource === "dispense")
        result.prescription_line = result.prescription_line || null;
      if (resource === "patients") {
        if (patientRecord && result.preferred_branch === patientRecord.preferred_branch) {
          delete result.preferred_branch;
        } else {
          result.preferred_branch = result.preferred_branch || null;
        }
      }
      if (resource === "branchPreference") result.preferred_branch = result.preferred_branch || null;
      if (resource === "branches") {
        result.latitude = result.latitude === "" || result.latitude == null ? null : result.latitude;
        result.longitude = result.longitude === "" || result.longitude == null ? null : result.longitude;
      }
      if (resource === "users") {
        const patientPreferenceUnspecified =
          result.role === "Patient" && (!values.patient || (!record?.patient && !result.branch));
        if (record?.patient || result.role !== "Patient" || !result.patient) delete result.patient;
        if (
          result.role === "Admin" ||
          patientPreferenceUnspecified ||
          (record && result.branch === record.branch)
        ) {
          delete result.branch;
        } else {
          result.branch = result.branch || null;
        }
      }
      if (record && result.password === "") delete result.password;
      await onSave(result);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.code : "error");
      setErrorFields(e instanceof ApiError ? e.fields : []);
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }
  return (
    <>
      <Dialog
        open
        onClose={busy ? undefined : onClose}
        fullWidth
        maxWidth="md"
        slotProps={{
          paper: {
            component: "form",
            onSubmit: (e: React.FormEvent) => {
              e.preventDefault();
              if (busy || !ready) return;
              if (resource === "dispense") setConfirm(true);
              else void submit();
            },
          },
        }}
      >
        <DialogTitle>
          {t(resource === "dispense" ? "dispense" : record ? "edit" : "create")}{" "}
          <span className="dialog-subtitle">{t(resource)}</span>
        </DialogTitle>
        <DialogContent>
          {activeBranch && (resource === "batches" || resource === "dispense") && (
            <p><strong>{t("branch")}</strong> · {activeBranch.name} · {activeBranch.code}</p>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {t(error, { defaultValue: t("error") })}
            </Alert>
          )}
          {!ready && !error && <p role="status">{t("loading")}</p>}
          {ready && (
            <div className="form-grid">
              {fields.map((f) => {
                const control = field(f, values, (key, value) => {
                  const updated = { ...values, [key]: value };
                  if (key === "patient" && resource === "dispense") updated.prescription_line = "";
                  if (key === "role" && resource === "users") {
                    updated.branch = value === "Pharmacist" ? (activeBranch?.id ?? "") : "";
                  }
                  setValues(updated);
                });
                if (resource !== "patients" || f.name !== "allergies") return control;
                return (
                  <div key={f.name}>
                    {control}
                    <Button onClick={() => setAddingAllergy(true)} disabled={busy}>
                      {t("addCatalogAllergy")}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          {resource === "prescriptions" && (
            <div className="prescription-editor">
              {lines.map((line, index) => (
                <section key={index}>
                  <h3>
                    {t("medication")} {index + 1}
                  </h3>
                  <div className="form-grid">
                    {[
                      { name: "medication", relation: "medications" },
                      { name: "quantity_prescribed", type: "number" },
                      { name: "directions" },
                    ].map((f) =>
                      field(f, line, (key, value) =>
                        setLines(
                          lines.map((l, i) =>
                            i === index ? { ...l, [key]: value } : l,
                          ),
                        ),
                      ),
                    )}
                  </div>
                  <Button
                    disabled={lines.length === 1}
                    onClick={() =>
                      setLines(lines.filter((_, i) => i !== index))
                    }
                  >
                    {t("remove")}
                  </Button>
                </section>
              ))}
              <Button
                onClick={() =>
                  setLines([
                    ...lines,
                    { medication: "", quantity_prescribed: 1, directions: "" },
                  ])
                }
              >
                {t("addLine")}
              </Button>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button disabled={busy || !ready} variant="contained" type="submit">
            {t(busy ? "loading" : "save")}
          </Button>
        </DialogActions>
      </Dialog>
      {addingAllergy && (
        <ResourceForm
          resource="allergies"
          data={data}
          callApi={callApi}
          onClose={() => setAddingAllergy(false)}
          onSave={addAllergy}
        />
      )}
      <Dialog
        open={confirm}
        onClose={busy ? undefined : () => setConfirm(false)}
      >
        <DialogTitle>{t("dispense")}</DialogTitle>
        <DialogContent>{t("confirm")}</DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setConfirm(false)}>
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            disabled={busy}
            onClick={() => void submit()}
          >
            {t("dispense")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
