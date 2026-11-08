import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, TextField } from "@mui/material";
import { api, ApiError, type RecordData, type User } from "./api";
import Workspace, { Brand, LanguageSelect, PageHeader } from "./Workspace";
import Dashboard from "./Dashboard";
import RecordList from "./RecordList";
import ResourceForm from "./ResourceForm";
import AdminPanel from "./AdminPanel";
import Icon from "./Icon";
import "./styles.css";

const endpoints = [
  "patients",
  "medications",
  "batches",
  "prescriptions",
  "dispensings",
  "categories",
  "suppliers",
  "doctors",
];
const editable = [
  "patients",
  "medications",
  "categories",
  "suppliers",
  "doctors",
];
export default function App() {
  const { t, i18n } = useTranslation(),
    location = useLocation(),
    navigate = useNavigate();
  const page = location.pathname.split("/")[1] || "overview";
  const [user, setUser] = useState<User | null>(null),
    [checking, setChecking] = useState(true),
    [registering, setRegistering] = useState(false);
  const [data, setData] = useState<Record<string, RecordData[]>>({}),
    [rows, setRows] = useState<RecordData[]>([]),
    [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [revision, setRevision] = useState(0);
  const [form, setForm] = useState<{
    resource: string;
    record?: RecordData;
  } | null>(null);
  const staff = user?.role === "Admin" || user?.role === "Pharmacist";
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.title = t("title") + " — " + t(page);
  }, [i18n.language, page, t]);
  useEffect(() => {
    api("auth/me/")
      .then(setUser)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    setRows([]);
    setSearch("");
    setMessage("");
    setForm(null);
  }, [page]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    setBusy(true);
    Promise.all(endpoints.map(async (key) => [key, await api(key + "/")]))
      .then((entries) => {
        if (active) setData(Object.fromEntries(entries));
      })
      .catch((e) => {
        if (active) showError(e);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, revision]);
  useEffect(() => {
    if (!user || !endpoints.includes(page)) return;
    let active = true;
    const timer = setTimeout(
      () =>
        api(page + "/?search=" + encodeURIComponent(search))
          .then((value) => {
            if (active) setRows(value);
          })
          .catch((e) => {
            if (active) showError(e);
          }),
      200,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user?.id, page, search, revision]);
  function showError(error: unknown) {
    setMessage(error instanceof ApiError ? error.code : "error");
  }
  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const payload = Object.fromEntries(new FormData(event.currentTarget));
    try {
      setUser(
        await api(
          "auth/" + (registering ? "register/" : "login/"),
          "POST",
          payload,
        ),
      );
      setRevision((x) => x + 1);
    } catch (e) {
      showError(e);
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    try {
      await api("auth/logout/", "POST");
      setUser(null);
      setData({});
      setRows([]);
      setMessage("");
      navigate("/");
    } catch (e) {
      showError(e);
    }
  }
  async function save(values: Record<string, any>) {
    if (!form) return;
    const resource = form.resource,
      record = form.record;
    await api(
      resource === "profile"
        ? "auth/me/"
        : (resource === "dispense" ? "dispensings" : resource) +
            "/" +
            (record ? record.id + "/" : ""),
      resource === "profile" || record ? "PATCH" : "POST",
      values,
    );
    if (resource === "profile") setUser(await api("auth/me/"));
    setRevision((x) => x + 1);
    setMessage("saved");
  }
  if (checking)
    return (
      <div className="startup">
        <Brand />
        <p role="status">{t("loading")}</p>
      </div>
    );
  if (!user)
    return (
      <div className="auth-page">
        <section className="auth-story">
          <Brand />
          <div className="auth-editorial">
            <span className="eyebrow">{t("connectedCare")}</span>
            <h1>
              {t("authHeadline")}
              <em>{t("authAccent")}</em>
            </h1>
            <p>{t("authDescription")}</p>
            <div className="auth-proof">
              <span>
                <Icon name="patients" />
                {t("patients")}
              </span>
              <span>
                <Icon name="prescriptions" />
                {t("prescriptions")}
              </span>
              <span>
                <Icon name="batches" />
                {t("batches")}
              </span>
            </div>
          </div>
          <span className="auth-edition">01 / PHARMACY IS</span>
        </section>
        <section className="auth-form-side">
          <div className="auth-language">
            <LanguageSelect />
          </div>
          <form onSubmit={authenticate} className="auth-form">
            <span className="eyebrow">
              {t(registering ? "patientPortal" : "welcomeBack")}
            </span>
            <h2>{t(registering ? "register" : "login")}</h2>
            <p>{t(registering ? "registerDescription" : "loginDescription")}</p>
            {message && (
              <Alert severity="error">
                {t(message, { defaultValue: t("error") })}
              </Alert>
            )}
            <TextField
              fullWidth
              label={t("username")}
              name="username"
              required
              autoComplete="username"
            />
            <TextField
              fullWidth
              label={t("password")}
              name="password"
              type="password"
              required
              autoComplete={registering ? "new-password" : "current-password"}
            />
            {registering && (
              <>
                <TextField
                  fullWidth
                  label={t("full_name")}
                  name="full_name"
                  required
                />
                <TextField
                  fullWidth
                  label={t("date_of_birth")}
                  name="date_of_birth"
                  type="date"
                  required
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </>
            )}
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={busy}
              endIcon={<Icon name="arrow" />}
            >
              {t(registering ? "register" : "login")}
            </Button>
            <div className="auth-switch">
              <span>{t(registering ? "alreadyAccount" : "noAccount")}</span>
              <Button
                onClick={() => {
                  setRegistering(!registering);
                  setMessage("");
                }}
              >
                {t(registering ? "login" : "register")}
              </Button>
            </div>
          </form>
          <p className="auth-disclaimer">{t("demoNotice")}</p>
        </section>
      </div>
    );
  const allowed =
    staff ||
    ![
      "medications",
      "batches",
      "categories",
      "suppliers",
      "doctors",
      "dispense",
    ].includes(page);
  const content =
    page === "admin" ? (
      user.role === "Admin" ? (
        <AdminPanel data={data} onChanged={() => setRevision((x) => x + 1)} />
      ) : (
        <div className="access-denied">
          <Icon name="admin" size={44} />
          <h1>{t("accessDenied")}</h1>
          <p>{t("accessDescription")}</p>
          <Button variant="contained" onClick={() => navigate("/")}>
            {t("backWorkspace")}
          </Button>
        </div>
      )
    ) : !allowed ? (
      <div className="access-denied">
        <h1>{t("accessDenied")}</h1>
        <Button onClick={() => navigate("/")}>{t("backWorkspace")}</Button>
      </div>
    ) : page === "overview" ? (
      <Dashboard data={data} user={user} />
    ) : page === "profile" ? (
      <>
        <PageHeader
          title={t("profile")}
          description={t("profileDescription")}
        />
        <section className="profile-panel">
          <span className="profile-monogram">
            {user.username.slice(0, 2).toUpperCase()}
          </span>
          <h2>
            {user.first_name || user.username} {user.last_name}
          </h2>
          <span className="role-label">{t(user.role || "unassigned")}</span>
          <dl>
            <div>
              <dt>{t("username")}</dt>
              <dd>{user.username}</dd>
            </div>
            <div>
              <dt>{t("email")}</dt>
              <dd>{user.email || "—"}</dd>
            </div>
          </dl>
          <Button
            variant="contained"
            startIcon={<Icon name="edit" />}
            onClick={() =>
              setForm({ resource: "profile", record: user as RecordData })
            }
          >
            {t("edit")}
          </Button>
        </section>
      </>
    ) : page === "dispense" ? (
      <>
        <PageHeader
          title={t("dispense")}
          description={t("dispenseDescription")}
        />
        <section className="dispense-intro">
          <span className="large-icon">
            <Icon name="medications" size={42} />
          </span>
          <h2>{t("dispenseTitle")}</h2>
          <p>{t("dispenseHint")}</p>
          <Button
            variant="contained"
            startIcon={<Icon name="dispense" />}
            onClick={() => setForm({ resource: "dispense" })}
          >
            {t("dispense")}
          </Button>
        </section>
      </>
    ) : endpoints.includes(page) ? (
      <>
        <PageHeader
          title={t(page)}
          description={t(page + "Description", {
            defaultValue: t("recordsDescription"),
          })}
          action={
            staff && page !== "dispensings" ? (
              <Button
                variant="contained"
                startIcon={<Icon name="dispense" />}
                onClick={() => setForm({ resource: page })}
              >
                {t("create")}
              </Button>
            ) : undefined
          }
        />
        <section className="ledger">
          <div className="ledger-toolbar">
            <div>
              <h2>{t("allRecords")}</h2>
              <span className="record-count">
                {rows.length} {t("records")}
              </span>
            </div>
            <div className="ledger-tools">
              <TextField
                size="small"
                label={t("search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button disabled={busy} onClick={() => setRevision((x) => x + 1)}>
                {t("refresh")}
              </Button>
            </div>
          </div>
          {busy ? (
            <div className="loading-state" role="status">
              {t("loading")}
            </div>
          ) : (
            <RecordList
              resource={page}
              rows={rows}
              data={data}
              onEdit={
                staff && editable.includes(page)
                  ? (record) => setForm({ resource: page, record })
                  : undefined
              }
            />
          )}
        </section>
      </>
    ) : (
      <div className="access-denied">
        <h1>{t("not_found")}</h1>
        <Button onClick={() => navigate("/")}>{t("backWorkspace")}</Button>
      </div>
    );
  return (
    <Workspace user={user} page={page} onLogout={() => void logout()}>
      {message && (
        <Alert
          sx={{ mb: 3 }}
          severity={message === "saved" ? "success" : "error"}
        >
          {t(message, { defaultValue: t("error") })}
        </Alert>
      )}
      {content}
      {form && (
        <ResourceForm
          resource={form.resource}
          record={form.record}
          data={data}
          onClose={() => setForm(null)}
          onSave={save}
        />
      )}
    </Workspace>
  );
}
