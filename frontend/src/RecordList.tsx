import { useTranslation } from "react-i18next";
import { Button, Chip } from "@mui/material";
import type { RecordData } from "./api";
import Icon from "./Icon";
const columns: Record<string, string[]> = {
  patients: ["full_name", "reference", "date_of_birth", "phone"],
  medications: [
    "name",
    "strength",
    "category",
    "requires_prescription",
    "is_active",
  ],
  batches: [
    "medication_name",
    "lot_number",
    "expires_on",
    "stock_quantity",
    "unit_price",
  ],
  prescriptions: ["reference", "patient_name", "valid_until", "status"],
  dispensings: [
    "medication_name",
    "patient_name",
    "quantity",
    "unit_price",
    "dispensed_at",
  ],
  categories: ["name"],
  suppliers: ["name", "phone"],
  doctors: ["full_name", "license_number"],
  users: ["username", "email", "role", "is_active"],
};
export default function RecordList({
  resource,
  rows,
  data,
  onEdit,
  onDelete,
}: {
  resource: string;
  rows: RecordData[];
  data: Record<string, RecordData[]>;
  onEdit?: (row: RecordData) => void;
  onDelete?: (row: RecordData) => void;
}) {
  const { t, i18n } = useTranslation();
  const fields = columns[resource] || ["name"];
  function value(row: RecordData, key: string) {
    const v = row[key];
    if (key === "category")
      return (data.categories || []).find((item) => item.id === v)?.name || "—";
    if (key === "status" || key === "role")
      return (
        <Chip
          size="small"
          className={"status-chip status-" + v}
          label={t(v || "unassigned")}
        />
      );
    if (typeof v === "boolean")
      return (
        <span className={"boolean-state " + (v ? "positive" : "muted")}>
          {t(v ? "yes" : "no")}
        </span>
      );
    if (key === "unit_price")
      return new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(v));
    if (key === "dispensed_at")
      return new Date(v).toLocaleString(i18n.language, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    return v || v === 0 ? String(v) : "—";
  }
  if (!rows.length)
    return (
      <div className="empty-state">
        <Icon name="search" size={32} />
        <h2>{t("empty")}</h2>
        <p>{t("emptyDescription")}</p>
      </div>
    );
  return (
    <div className="records-wrap">
      <table className="records-table">
        <thead>
          <tr>
            {fields.map((key) => (
              <th key={key} scope="col">
                {t(key)}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th scope="col" className="actions-column">
                {t("actions")}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td
                colSpan={fields.length + (onEdit || onDelete ? 1 : 0)}
                className="record-cell"
              >
                <div
                  className="record-grid"
                  style={{ "--columns": fields.length } as React.CSSProperties}
                >
                  {fields.map((key, index) => (
                    <div
                      key={key}
                      className={
                        index === 0 ? "record-primary" : "record-value"
                      }
                    >
                      <span className="mobile-label">{t(key)}</span>
                      {index === 0 && resource === "patients" && (
                        <span className="record-avatar" aria-hidden="true">
                          {String(row.full_name).slice(0, 1)}
                        </span>
                      )}
                      {value(row, key)}
                    </div>
                  ))}
                  {(onEdit || onDelete) && (
                    <div className="row-actions">
                      {onEdit && (
                        <Button
                          size="small"
                          startIcon={<Icon name="edit" size={15} />}
                          onClick={() => onEdit(row)}
                        >
                          {t("edit")}
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Icon name="delete" size={15} />}
                          onClick={() => onDelete(row)}
                        >
                          {t("delete")}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {row.lines && (
                  <details className="line-details">
                    <summary>
                      {t("details")} · {row.lines.length}{" "}
                      {t("prescriptionLines")}
                    </summary>
                    <div>
                      {row.lines.map((line: RecordData) => (
                        <p key={line.id}>
                          <strong>{line.medication_name}</strong> ·{" "}
                          {t("quantity_prescribed")}: {line.quantity_prescribed}{" "}
                          · {t("remaining")}: {line.remaining}
                          <br />
                          {line.directions}
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
