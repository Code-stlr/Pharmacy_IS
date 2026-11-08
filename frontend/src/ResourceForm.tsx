import { useState } from "react";
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
import { ApiError, type RecordData } from "./api";
import { resources, type Field } from "./resources";

export default function ResourceForm({
  resource,
  record,
  data,
  onClose,
  onSave,
}: {
  resource: string;
  record?: RecordData;
  data: Record<string, RecordData[]>;
  onClose: () => void;
  onSave: (values: Record<string, any>) => Promise<void>;
}) {
  const { t } = useTranslation();
  const schema = resources[resource] || [];
  const [values, setValues] = useState<Record<string, any>>(
    record
      ? { ...record }
      : Object.fromEntries(
          schema.map((field) => [
            field.name,
            field.type === "boolean" ? true : field.options?.[0] || "",
          ]),
        ),
  );
  const [lines, setLines] = useState<Record<string, any>[]>([
    { medication: "", quantity_prescribed: 1, directions: "" },
  ]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [errorFields, setErrorFields] = useState<string[]>([]),
    [confirm, setConfirm] = useState(false);
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
    const options =
      field.relation === "lines"
        ? lineOptions
        : data[field.relation || ""] || [];
    const select = Boolean(
      field.relation || field.options || field.type === "boolean",
    );
    const optional =
      field.optional || (field.name === "password" && Boolean(record));
    return (
      <TextField
        key={field.name}
        fullWidth
        label={t(field.name)}
        required={!optional}
        value={
          field.type === "boolean"
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
        autoComplete={field.name === "password" ? "new-password" : "off"}
        slotProps={{
          inputLabel: { shrink: true },
          htmlInput: {
            min: field.name === "stock_quantity" ? 0 : 1,
            step: field.type === "decimal" ? "0.01" : undefined,
          },
        }}
        onChange={(event) =>
          update(
            field.name,
            field.type === "boolean"
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
                  <MenuItem key="none" value="">
                    {t("none")}
                  </MenuItem>,
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
  async function submit() {
    setBusy(true);
    setError("");
    try {
      const result = { ...values };
      delete result.id;
      if (resource === "prescriptions") result.lines = lines;
      if (resource === "dispense")
        result.prescription_line = result.prescription_line || null;
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
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {t(error, { defaultValue: t("error") })}
            </Alert>
          )}
          <div className="form-grid">
            {schema.map((f) =>
              field(f, values, (key, value) =>
                setValues({
                  ...values,
                  [key]: value,
                  ...(key === "patient" ? { prescription_line: "" } : {}),
                }),
              ),
            )}
          </div>
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
          <Button disabled={busy} variant="contained" type="submit">
            {t(busy ? "loading" : "save")}
          </Button>
        </DialogActions>
      </Dialog>
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
