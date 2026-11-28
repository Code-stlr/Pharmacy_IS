import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Button, MenuItem, TextField } from "@mui/material";
import { api, ApiError, type Branch, type RecordData, type User } from "./api";
import Workspace, { Brand, LanguageSelect, PageHeader } from "./Workspace";
import Dashboard from "./Dashboard";
import RecordList from "./RecordList";
import ResourceForm from "./ResourceForm";
import PatientHistory from "./PatientHistory";
import AdminPanel from "./AdminPanel";
import Icon from "./Icon";
import "./styles.css";
import Metasearch from "./Metasearch";
import NeonAuthPage from "./NeonAuthPage";
import { authConfiguration, signOutNeon } from "./neon";
import BranchSelect from "./BranchSelect";
import ChangePassword from "./ChangePassword";

const endpoints = [
  "patients",
  "medications",
  "batches",
  "stock",
  "prescriptions",
  "dispensings",
  "allergies",
  "categories",
  "suppliers",
  "doctors",
];
const editable = [
  "patients",
  "allergies",
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
  const [neonEnabled, setNeonEnabled] = useState<boolean | null>(null);
  const [registrationBranch, setRegistrationBranch] = useState<number | "">("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null),
    [checking, setChecking] = useState(true),
    [registering, setRegistering] = useState(false),
    [authenticating, setAuthenticating] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]),
    [sessionAction, setSessionAction] = useState<"branch" | "logout" | null>(null),
    [patientHistory, setPatientHistory] = useState<number | null>(null);
  const [data, setData] = useState<Record<string, RecordData[]>>({}),
    [rows, setRows] = useState<RecordData[]>([]),
    [search, setSearch] = useState(""),
    [patientBranch, setPatientBranch] = useState("all"),
    [stockPatient, setStockPatient] = useState(""),
    [stockFilter, setStockFilter] = useState("");
  const [busy, setBusy] = useState(false),
    [listBusy, setListBusy] = useState(true),
    [message, setMessage] = useState(""),
    [revision, setRevision] = useState(0);
  const [form, setForm] = useState<{
    resource: string;
    record?: RecordData;
  } | null>(null);
  const sessionVersion = useRef(0);
  const currentVersion = sessionVersion.current;
  const staff = user?.role === "Admin" || user?.role === "Pharmacist";
  const branchId = user?.active_branch?.id;
  const staffBranchId = staff ? branchId : undefined;
  const workspaceApi = useCallback<typeof api>(
    (path, method, payload) => api(path, method, payload, staffBranchId),
    [staffBranchId],
  );
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.title = t("title") + " — " + t(page);
  }, [i18n.language, page, t]);
  useEffect(() => {
    authConfiguration().then((config) => {
      setNeonEnabled(Boolean(config.neonAuthUrl));
      return api("auth/me/");
    })
      .then(setUser)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (!neonEnabled || !user) return;
    let active = true;
    const restore = () => {
      const version = sessionVersion.current;
      void api("auth/me/").then((updated) => {
        if (active && version === sessionVersion.current) updateIdentity(updated);
      }).catch((error) => {
        if (active && version === sessionVersion.current) showError(error);
      });
    };
    window.addEventListener("focus", restore);
    return () => { active = false; window.removeEventListener("focus", restore); };
  }, [neonEnabled, user?.id, user?.role, branchId]);
  useEffect(() => {
    if (!user && !registering) return;
    let active = true;
    api("branches/")
      .then((value) => {
        if (active && Array.isArray(value)) setBranches(value);
      })
      .catch((error) => {
        if (active) showError(error);
      });
    return () => {
      active = false;
    };
  }, [user?.id, registering]);
  useEffect(() => {
    setRows([]);
    setSearch("");
    setPatientBranch("all");
    setStockFilter("");
    setMessage("");
    setForm((current) => current?.resource === page ? current : null);
    setPatientHistory(null);
  }, [page]);
  useEffect(() => {
    if (!user || sessionAction) return;
    let active = true;
    setBusy(true);
    Promise.all(endpoints.map(async (key) => [key, await workspaceApi(key + "/")]))
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
  }, [user?.id, workspaceApi, sessionAction, revision]);
  useEffect(() => {
    if (!user || sessionAction || !endpoints.includes(page)) return;
    let active = true;
    setListBusy(true);
    const timer = setTimeout(
      () =>
        workspaceApi(
          page +
            "/?search=" +
            encodeURIComponent(search) +
            (page === "patients" && staff && patientBranch !== "all"
              ? "&preferred_branch=" + encodeURIComponent(patientBranch)
              : "") +
            (page === "stock" && stockPatient ? "&patient=" + stockPatient : "") +
            (page === "stock" && stockFilter ? "&filter=" + stockFilter : ""),
        )
          .then((value) => {
            if (active) setRows(value);
          })
          .catch((e) => {
            if (active) showError(e);
          }).finally(() => {
            if (active) setListBusy(false);
          }),
      200,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user?.id, workspaceApi, sessionAction, page, search, staff, patientBranch, stockPatient, stockFilter, revision]);
  function showError(error: unknown) {
    if (neonEnabled && error instanceof ApiError && error.code === "unauthorized") {
      sessionVersion.current += 1;
      clearWorkspace();
      setUser(null);
    }
    setMessage(error instanceof ApiError ? error.code : "error");
  }
  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthenticating(true);
    setMessage("");
    const payload: Record<string, FormDataEntryValue | null> = Object.fromEntries(new FormData(event.currentTarget));
    if (registering && payload.password !== payload.confirm_password) {
      setMessage("passwordMismatch");
      setAuthenticating(false);
      return;
    }
    delete payload.confirm_password;
    if (registering && payload.preferred_branch === "") payload.preferred_branch = null;
    try {
      setUser(
        await api(
          "auth/" + (registering ? "register/" : "login/"),
          "POST",
          payload,
        ),
      );
      setRegistering(false);
      setRevision((x) => x + 1);
    } catch (e) {
      showError(e);
    } finally {
      setAuthenticating(false);
    }
  }
  async function logout() {
    if (sessionAction || currentVersion !== sessionVersion.current) return;
    sessionVersion.current += 1;
    setSessionAction("logout");
    try {
      await api("auth/logout/", "POST");
      await signOutNeon();
      clearWorkspace();
      setUser(null);
      setMessage("");
      navigate("/");
    } catch (e) {
      showError(e);
    } finally {
      setSessionAction(null);
    }
  }
  function clearWorkspace() {
    setChangingPassword(false);
    setData({});
    setRows([]);
    setForm(null);
    setPatientHistory(null);
    setStockPatient("");
    setStockFilter("");
    setSearch("");
  }
  function updateIdentity(updated: User) {
    if (updated.id !== user?.id || updated.role !== user?.role || updated.active_branch?.id !== branchId) {
      sessionVersion.current += 1;
      clearWorkspace();
    }
    setUser(updated);
  }
  async function switchBranch(id: number) {
    if (id === branchId || sessionAction || currentVersion !== sessionVersion.current) return;
    sessionVersion.current += 1;
    setSessionAction("branch");
    setMessage("");
    try {
      updateIdentity(await api("auth/branch/", "POST", { branch: id }));
    } catch (error) {
      showError(error);
    } finally {
      setSessionAction(null);
    }
  }
  async function refreshAdminData(resource: string) {
    if (currentVersion !== sessionVersion.current) return;
    if (resource === "branches") {
      try {
        const [updated, activeBranches] = await Promise.all([
          api("auth/me/"),
          api("branches/"),
        ]);
        if (currentVersion !== sessionVersion.current) return;
        updateIdentity(updated);
        setBranches(activeBranches);
      } catch (error) {
        if (currentVersion !== sessionVersion.current) return;
        showError(error);
      }
    }
    setRevision((x) => x + 1);
  }
  async function save(values: Record<string, any>) {
    if (!form) return;
    const resource = form.resource,
      record = form.record;
    const updated = await workspaceApi(
      resource === "branchPreference" ? "auth/patient/" : resource === "profile"
        ? "auth/me/"
        : (resource === "dispense" ? "dispensings" : resource) +
            "/" +
            (record ? record.id + "/" : ""),
      resource === "profile" || resource === "branchPreference" || record ? "PATCH" : "POST",
      values,
    );
    if (currentVersion !== sessionVersion.current) return;
    if (resource === "profile") updateIdentity(updated);
    if (resource === "branchPreference") {
      const updatedIdentity = await api("auth/me/");
      if (currentVersion !== sessionVersion.current) return;
      updateIdentity(updatedIdentity);
    }
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
  if (neonEnabled === null)
    return <div className="startup"><Brand /><Alert severity="error">{t("offline")}</Alert><Button onClick={() => window.location.reload()}>{t("refresh")}</Button></div>;
  if (!user && neonEnabled)
    return <NeonAuthPage onAuthenticated={(value) => { setUser(value); navigate("/"); setRevision((x) => x + 1); }} />;
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
                <TextField fullWidth label={t("confirmPassword")} name="confirm_password" type="password" autoComplete="new-password" required />
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
                {branches.length > 0 && <BranchSelect branches={branches} value={registrationBranch} onChange={setRegistrationBranch} disabled={authenticating} />}
              </>
            )}
            <Button
              fullWidth
              variant={registering ? "contained" : "outlined"}
              className="auth-submit"
              type="submit"
              disabled={authenticating}
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
      "stock",
      "allergies",
      "categories",
      "suppliers",
      "doctors",
      "dispense",
    ].includes(page);
  const content =
    page === "admin" ? (
      user.role === "Admin" ? (
        <AdminPanel
          key={user.id + ":" + (branchId ?? "")}
          data={{ ...data, branches }}
          activeBranch={user.active_branch}
          callApi={workspaceApi}
          onChanged={refreshAdminData}
        />
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
            {user.role === "Patient" && (
              <div>
                <dt>{t("preferred_branch")}</dt>
                <dd>{user.active_branch?.name ?? t("none")}</dd>
              </div>
            )}
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
          {user.role === "Patient" && <Button sx={{ ml: 2 }} variant="outlined" onClick={() => setForm({ resource: "branchPreference", record: { id: user.id, preferred_branch: user.active_branch?.id ?? "" } })}>{t("branchPreference")}</Button>}
          {neonEnabled && staff && <Button sx={{ ml: 2 }} variant="outlined" onClick={() => setChangingPassword(true)}>{t("changePassword")}</Button>}
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
    ) : page === "metasearch" ? (
        <Metasearch />
    ) : endpoints.includes(page) ? (
      <>
        <PageHeader
          title={t(page)}
          description={t(page + "Description", {
            defaultValue: t("recordsDescription"),
          })}
          action={
            staff && page !== "dispensings" && page !== "stock" ? (
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
                {listBusy ? t("loading") : `${rows.length} ${t("records")}`}
              </span>
              {page === "stock" && (
                <span className="record-count">
                  {" · "}
                  {t("totalValue")}:{" "}
                  {new Intl.NumberFormat(i18n.language, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(
                    rows.reduce((sum, r) => sum + Number(r.stock_value || 0), 0),
                  )}
                </span>
              )}
            </div>
            <div className="ledger-tools">
              <TextField
                size="small"
                label={t("search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {page === "patients" && staff && (
                <TextField
                  size="small"
                  select
                  label={t("preferred_branch")}
                  value={patientBranch}
                  onChange={(e) => setPatientBranch(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="all">{t("allBranches")}</MenuItem>
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={String(branch.id)}>
                      {branch.name}
                    </MenuItem>
                  ))}
                  <MenuItem value="unassigned">{t("noPreferredBranch")}</MenuItem>
                </TextField>
              )}
              {page === "stock" && (
                <TextField
                  size="small"
                  select
                  label={t("stockFilter")}
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  sx={{ minWidth: 200 }}
                >
                  <MenuItem value="">{t("filterAll")}</MenuItem>
                  <MenuItem value="low">{t("filterLow")}</MenuItem>
                  <MenuItem value="expiring">{t("filterExpiring")}</MenuItem>
                  <MenuItem value="expired">{t("filterExpired")}</MenuItem>
                </TextField>
              )}
              {page === "stock" && (
                <TextField
                  size="small"
                  select
                  label={t("checkAllergiesFor")}
                  value={stockPatient}
                  onChange={(e) => setStockPatient(e.target.value)}
                  sx={{ minWidth: 220 }}
                >
                  <MenuItem value="">{t("none")}</MenuItem>
                  {(data.patients || []).map((p) => (
                    <MenuItem key={p.id} value={String(p.id)}>
                      {p.full_name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              <Button disabled={busy} onClick={() => setRevision((x) => x + 1)}>
                {t("refresh")}
              </Button>
            </div>
          </div>
          {busy || listBusy ? (
            <div className="loading-state" role="status">
              {t("loading")}
            </div>
          ) : (
            <RecordList
              resource={page}
              rows={rows}
              data={data}
              onView={page === "patients" ? (row) => setPatientHistory(row.id) : undefined}
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
    <Workspace
      user={user}
      page={page}
      branches={branches}
      transitioning={Boolean(sessionAction)}
      onSwitchBranch={(id) => void switchBranch(id)}
      onLogout={() => void logout()}
    >
      {message && (
        <Alert
          sx={{ mb: 3 }}
          severity={message === "saved" || message === "passwordChanged" ? "success" : "error"}
        >
          {t(message, { defaultValue: t("error") })}
        </Alert>
      )}
      {sessionAction ? (
        <div className="loading-state" role="status">{t(sessionAction === "branch" ? "switchingBranch" : "loading")}</div>
      ) : content}
      {!sessionAction && form && (
        <ResourceForm
          resource={form.resource}
          record={form.record}
          data={{ ...data, branches }}
          callApi={workspaceApi}
          activeBranch={user.active_branch}
          onClose={() => setForm((current) => current === form ? null : current)}
          onSave={save}
          onAllergyAdded={() => setRevision((x) => x + 1)}
        />
      )}
      {!sessionAction && patientHistory !== null && (
        <PatientHistory
          patientId={patientHistory}
          callApi={workspaceApi}
          onClose={() => setPatientHistory(null)}
        />
      )}
      {changingPassword && neonEnabled && staff && <ChangePassword onClose={() => setChangingPassword(false)} onChanged={() => setMessage("passwordChanged")} />}
    </Workspace>
  );
}
