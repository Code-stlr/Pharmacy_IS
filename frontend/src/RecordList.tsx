import { useTranslation } from "react-i18next";
import { Button, Chip } from "@mui/material";
import type { RecordData } from "./api";
import Icon from "./Icon";
const columns: Record<string, string[]> = {
  patients: ["full_name", "reference", "date_of_birth", "phone", "allergy_names"],
  allergies: ["name", "ingredient_keyword"],
  stock: [
    "name",
    "total_stock",
    "min_price",
    "max_price",
    "nearest_expiry",
    "stock_value",
    "expired_quantity",
    "unsafe_for_patient",
  ],
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
    "branch_name",
  ],
  categories: ["name"],
  suppliers: ["name", "phone"],
  doctors: ["full_name", "license_number"],
  users: ["username", "email", "role", "branch", "is_active"],
  branches: ["name", "code", "address", "is_active"],
};
export default function RecordList({
  resource,
  rows,
  data,
  onView,
  onEdit,
  onDelete,
}: {
  resource: string;
  rows: RecordData[];
  data: Record<string, RecordData[]>;
  onView?: (row: RecordData) => void;
  onEdit?: (row: RecordData) => void;
  onDelete?: (row: RecordData) => void;
}) {
  const { t, i18n } = useTranslation();
  const fields = columns[resource] || ["name"];
  const hasActions = Boolean(onView || onEdit || onDelete);
  function value(row: RecordData, key: string) {
    const v = row[key];
    if (key === "category")
      return (data.categories || []).find((item) => item.id === v)?.name || "—";
    if (key === "branch")
      return (data.branches || []).find((item) => item.id === v)?.name || (v ? t("inactiveBranch") : "—");
    if (key === "allergy_names")
      return Array.isArray(v) && v.length ? v.join(", ") : "—";
    if (key === "total_stock")
      return (
        <Chip
          size="small"
          color={v === 0 ? "error" : v < 20 ? "warning" : "success"}
          label={String(v)}
        />
      );
    if (key === "nearest_expiry" && v) {
      const days = Math.ceil((new Date(v).getTime() - Date.now()) / 86400000);
      return (
        <span className={days <= 30 ? "boolean-state muted" : undefined}>
          {v}
          {days <= 30 ? " · " + t("expiringSoon") : ""}
        </span>
      );
    }
    if (key === "expired_quantity")
      return v > 0 ? (
        <Chip size="small" color="error" label={String(v)} />
      ) : (
        "—"
      );
    if (key === "unsafe_for_patient")
      return v ? (
        <Chip size="small" color="error" label={t("allergyWarning")} />
      ) : (
        "—"
      );
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
    if (key === "unit_price" ||
      key === "min_price" ||
      key === "max_price" ||
      key === "stock_value") {
      if (v === null || v === undefined) return "—";
      return new Intl.NumberFormat(i18n.language, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(v));
    }
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
            {hasActions && (
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
                colSpan={fields.length + (hasActions ? 1 : 0)}
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
                  {hasActions && (
                    <div className="row-actions">
                      {onView && (
                        <Button size="small" onClick={() => onView(row)}>
                          {t("viewPatientHistory")}
                        </Button>
                      )}
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
                {resource === "stock" && Array.isArray(row.batches) && (
                  <details className="line-details">
                    <summary>
                      {t("details")} · {row.batches.length} {t("batches")}
                    </summary>
                    <div>
                      {row.batches.length === 0 && <p>—</p>}
                      {row.batches.map((b: RecordData) => (
                        <p key={b.id}>
                          <strong>{b.lot_number}</strong> · {t("stock_quantity")}:{" "}
                          {b.stock_quantity} · {t("unit_price")}:{" "}
                          {new Intl.NumberFormat(i18n.language, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(b.unit_price))}{" "}
                          {b.status === "pending" && b.received_on && (
                            <>· {t("received_on")}: {b.received_on} </>
                          )}
                          · {t("expires_on")}: {b.expires_on}{" "}
                          <Chip
                            size="small"
                            color={
                              b.status === "ok"
                                ? "success"
                                : b.status === "expiring"
                                  ? "warning"
                                  : b.status === "pending"
                                    ? "default"
                                    : "error"
                            }
                            label={t("batchStatus_" + b.status)}
                          />
                        </p>
                      ))}
                    </div>
                  </details>
                )}
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
