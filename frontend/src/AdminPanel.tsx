import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { api, ApiError, type RecordData } from "./api";
import { PageHeader } from "./Workspace";
import ResourceForm from "./ResourceForm";
import RecordList from "./RecordList";
import Icon from "./Icon";

export default function AdminPanel({
  data,
  onChanged,
}: {
  data: Record<string, RecordData[]>;
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState("users"),
    [rows, setRows] = useState<RecordData[]>([]),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [revision, setRevision] = useState(0);
  const [form, setForm] = useState<{ record?: RecordData } | null>(null),
    [deleting, setDeleting] = useState<RecordData | null>(null);
  useEffect(() => {
    let active = true;
    setBusy(true);
    api("admin/" + tab + "/")
      .then((result) => {
        if (active) setRows(result);
      })
      .catch((e) => {
        if (active) setMessage(e instanceof ApiError ? e.code : "error");
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [tab, revision]);
  function changed() {
    setRevision((x) => x + 1);
    onChanged();
    setMessage("saved");
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try {
      await api("admin/" + tab + "/" + deleting.id + "/", "DELETE");
      setDeleting(null);
      changed();
    } catch (e) {
      setMessage(e instanceof ApiError ? e.code : "error");
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  }
  const filtered = rows.filter((row) =>
    [row.username, row.name, row.full_name, row.reference, row.email].some(
      (value) =>
        String(value || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
    ),
  );
  return (
    <>
      <PageHeader
        title={t("adminTitle")}
        description={t("adminDescription")}
        action={
          <Button
            variant="contained"
            startIcon={<Icon name="dispense" />}
            onClick={() => setForm({})}
          >
            {t("create")} {t(tab)}
          </Button>
        }
      />
      <div className="admin-notice">
        <Icon name="admin" />
        <div>
          <strong>{t("adminOnly")}</strong>
          <span>{t("adminSafety")}</span>
        </div>
      </div>
      <div
        className="tab-strip"
        role="tablist"
        aria-label={t("administration")}
      >
        {[
          "users",
          "medications",
          "categories",
          "suppliers",
          "doctors",
          "patients",
        ].map((key) => (
          <button
            role="tab"
            aria-selected={tab === key}
            key={key}
            onClick={() => {
              setTab(key);
              setSearch("");
              setRows([]);
              setMessage("");
            }}
          >
            {t(key)}
          </button>
        ))}
      </div>
      {message && (
        <Alert severity={message === "saved" ? "success" : "error"}>
          {t(message, { defaultValue: t("error") })}
        </Alert>
      )}
      <section className="ledger">
        <div className="ledger-toolbar">
          <div>
            <h2>{t(tab)}</h2>
            <span className="record-count">
              {filtered.length} {t("records")}
            </span>
          </div>
          <TextField
            size="small"
            label={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {busy ? (
          <div className="loading-state" role="status">
            {t("loading")}
          </div>
        ) : (
          <RecordList
            resource={tab}
            rows={filtered}
            data={data}
            onEdit={(row) => setForm({ record: row })}
            onDelete={setDeleting}
          />
        )}
      </section>
      {form && (
        <ResourceForm
          resource={tab}
          record={form.record}
          data={data}
          onClose={() => setForm(null)}
          onSave={async (values) => {
            await api(
              "admin/" + tab + "/" + (form.record ? form.record.id + "/" : ""),
              form.record ? "PATCH" : "POST",
              values,
            );
            changed();
          }}
        />
      )}
      <Dialog
        open={Boolean(deleting)}
        onClose={busy ? undefined : () => setDeleting(null)}
      >
        <DialogTitle>{t("deleteTitle")}</DialogTitle>
        <DialogContent>
          <p>{t("deleteDescription")}</p>
          <strong>
            {deleting?.username ||
              deleting?.name ||
              deleting?.full_name ||
              deleting?.reference}
          </strong>
          <p>{t("protectedHint")}</p>
        </DialogContent>
        <DialogActions>
          <Button disabled={busy} onClick={() => setDeleting(null)}>
            {t("cancel")}
          </Button>
          <Button
            disabled={busy}
            variant="contained"
            color="error"
            onClick={() => void remove()}
          >
            {t("delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
