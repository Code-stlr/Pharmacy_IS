import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { RecordData, User } from "./api";
import Icon from "./Icon";
import { PageHeader } from "./Workspace";

export default function Dashboard({
  data,
  user,
}: {
  data: Record<string, RecordData[]>;
  user: User;
}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const staff = user.role === "Admin" || user.role === "Pharmacist";
  const batches = data.batches || [],
    transactions = data.dispensings || [],
    prescriptions = data.prescriptions || [];
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Qyzylorda",
  });
  const valid = batches.filter(
    (b) =>
      b.expires_on > today &&
      b.received_on <= today &&
      (data.medications || []).some(
        (m) => m.id === b.medication && m.is_active,
      ),
  );
  const units = valid.reduce((total, b) => total + b.stock_quantity, 0);
  const metrics = staff
    ? [
        ["patients", (data.patients || []).length, "patientMetric"],
        ["batches", units, "stockMetric"],
        [
          "prescriptions",
          prescriptions.filter((p) => p.status === "active").length,
          "rxMetric",
        ],
      ]
    : [
        ["prescriptions", prescriptions.length, "rxMetric"],
        ["dispensings", transactions.length, "historyMetric"],
        ["profile", 1, "profileMetric"],
      ];
  const statuses = [
    ["available", valid.filter((b) => b.stock_quantity > 20).length],
    [
      "lowStock",
      valid.filter((b) => b.stock_quantity > 0 && b.stock_quantity <= 20)
        .length,
    ],
    [
      "unavailable",
      batches.length - valid.filter((b) => b.stock_quantity > 0).length,
    ],
  ];
  const total = Math.max(batches.length, 1);
  return (
    <>
      <PageHeader
        title={t("overviewTitle")}
        description={t("overviewDescription")}
        action={
          <Button
            variant="contained"
            startIcon={<Icon name={staff ? "dispense" : "prescriptions"} />}
            onClick={() => navigate(staff ? "/dispense" : "/prescriptions")}
          >
            {t(staff ? "startDispensing" : "viewPrescriptions")}
          </Button>
        }
      />
      <section className="metric-strip" aria-label={t("overview")}>
        {metrics.map(([key, value, description], i) => (
          <div
            className="metric"
            key={key}
            style={{ animationDelay: i * 50 + "ms" }}
          >
            <span className="metric-label">
              <Icon name={String(key)} />
              {t(String(key))}
            </span>
            <strong>
              {new Intl.NumberFormat(i18n.language).format(Number(value))}
            </strong>
            <span>{t(String(description))}</span>
          </div>
        ))}
      </section>
      <div className="overview-grid">
        <section className="activity-panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">{t("activity")}</span>
              <h2>{t("recentDispensing")}</h2>
            </div>
            <Button
              onClick={() => navigate("/dispensings")}
              endIcon={<Icon name="arrow" size={16} />}
            >
              {t("viewAll")}
            </Button>
          </div>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <Icon name="dispensings" size={32} />
              <h3>{t("noActivity")}</h3>
              <p>{t("noActivityDescription")}</p>
            </div>
          ) : (
            <div className="activity-list">
              {transactions.slice(0, 5).map((item) => (
                <div key={item.id} className="activity-row">
                  <span className="activity-icon">
                    <Icon name="medications" />
                  </span>
                  <div>
                    <strong>{item.medication_name}</strong>
                    <span>{item.patient_name}</span>
                  </div>
                  <div className="activity-amount">
                    <strong>−{item.quantity}</strong>
                    <span>
                      {new Date(item.dispensed_at).toLocaleDateString(
                        i18n.language,
                        { month: "short", day: "numeric" },
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        {staff ? (
          <section className="stock-feature">
            <div className="eyebrow">{t("inventoryHealth")}</div>
            <Icon name="batches" size={36} />
            <h2>{t("stockTitle")}</h2>
            <p>{t("stockDescription")}</p>
            <div className="stock-bar" aria-hidden="true">
              {statuses
                .filter(([, count]) => Number(count) > 0)
                .map(([key, count]) => (
                  <span
                    key={key}
                    className={"bar-" + key}
                    style={{ flex: Number(count) / total }}
                  />
                ))}
            </div>
            <div className="stock-statuses">
              {statuses.map(([key, count]) => (
                <div key={key}>
                  <span>
                    <i className={"dot-" + key} />
                    {t(String(key))}
                  </span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
            <Button
              onClick={() => navigate("/batches")}
              endIcon={<Icon name="arrow" />}
            >
              {t("reviewInventory")}
            </Button>
          </section>
        ) : (
          <section className="stock-feature">
            <div className="eyebrow">{t("yourCare")}</div>
            <Icon name="profile" size={36} />
            <h2>{t("patientFeatureTitle")}</h2>
            <p>{t("patientFeatureDescription")}</p>
            <Button
              onClick={() => navigate("/profile")}
              endIcon={<Icon name="arrow" />}
            >
              {t("profile")}
            </Button>
          </section>
        )}
      </div>
      <div className="workflow-note">
        <Icon name="admin" />
        <p>{t("workflowNote")}</p>
      </div>
    </>
  );
}
