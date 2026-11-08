import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { api, ApiError, type RecordData, type User } from "./api";
import { languages } from "./i18n";
import { resources, type Field } from "./resources";

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
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [page, setPage] = useState("patients");
  const [data, setData] = useState<Record<string, RecordData[]>>({});
  const [rows, setRows] = useState<RecordData[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const [lines, setLines] = useState<Record<string, any>[]>([]);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [revision, setRevision] = useState(0);
  const staff = user?.role === "Admin" || user?.role === "Pharmacist";
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);
  useEffect(() => {
    api("auth/me/")
      .then(setUser)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    let active = true;
    setBusy(true);
    Promise.all(endpoints.map(async (key) => [key, await api(key + "/")]))
      .then((entries) => {
        if (active) setData(Object.fromEntries(entries));
      })
      .catch(showError)
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
    const timer = setTimeout(() => {
      api(page + "/?search=" + encodeURIComponent(search))
        .then((value) => {
          if (active) setRows(value);
        })
        .catch((error) => {
          if (active) showError(error);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user?.id, page, search, revision]);
  function showError(error: unknown) {
    setMessage(error instanceof ApiError ? error.code : "error");
    setFields(error instanceof ApiError ? error.fields : []);
  }
  function changePage(next: string) {
    setPage(next);
    setRows([]);
    setForm(null);
    setLines([]);
    setSearch("");
    setMessage("");
    setFields([]);
  }
  function startForm(row?: RecordData) {
    setForm(
      row
        ? { ...row }
        : Object.fromEntries(
            (resources[page] || []).map((field) => [
              field.name,
              field.type === "boolean" ? true : "",
            ]),
          ),
    );
    setLines(
      page === "prescriptions"
        ? [{ medication: "", quantity_prescribed: 1, directions: "" }]
        : [],
    );
    setMessage("");
    setFields([]);
  }
  function label(item: RecordData): string {
    return (
      String(
        item.full_name ||
          item.name ||
          item.reference ||
          item.medication_name ||
          item.id,
      ) +
      (item.strength ? " · " + item.strength : "") +
      (item.lot_number
        ? " · " + item.lot_number + " · " + item.stock_quantity
        : "")
    );
  }
  const lineOptions: RecordData[] = (data.prescriptions || [])
    .filter((p) => !form?.patient || p.patient === Number(form.patient))
    .flatMap((p) =>
      p.lines
        .filter((l: RecordData) => l.remaining > 0 && p.status === "active")
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
  function input(
    field: Field,
    values: Record<string, any>,
    update: (name: string, value: any) => void,
  ) {
    const options =
      field.relation === "lines"
        ? lineOptions
        : data[field.relation || ""] || [];
    const select = Boolean(field.relation) || field.type === "boolean";
    return (
      <TextField
        key={field.name}
        label={t(field.name)}
        value={values[field.name] ?? ""}
        select={select}
        required={!field.optional}
        error={fields.includes(field.name)}
        type={
          select
            ? undefined
            : field.type === "number" || field.type === "decimal"
              ? "number"
              : field.type || "text"
        }
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
              : field.relation ||
                  field.type === "number" ||
                  field.type === "decimal"
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
            : [
                <MenuItem key="none" value="">
                  {t("none")}
                </MenuItem>,
                ...options.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {label(item)}
                  </MenuItem>
                )),
              ])}
      </TextField>
    );
  }
  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      setUser(
        await api(
          "auth/" + (registering ? "register/" : "login/"),
          "POST",
          values,
        ),
      );
      setRevision((x) => x + 1);
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!form) return;
    setBusy(true);
    setMessage("");
    setFields([]);
    setConfirm(false);
    try {
      const payload = { ...form };
      delete payload.id;
      if (page === "prescriptions") payload.lines = lines;
      if (page === "dispense")
        payload.prescription_line = payload.prescription_line || null;
      await api(
        page === "profile"
          ? "auth/me/"
          : (page === "dispense" ? "dispensings" : page) +
              "/" +
              (form.id ? form.id + "/" : ""),
        page === "profile" || form.id ? "PATCH" : "POST",
        payload,
      );
      if (page === "profile") setUser(await api("auth/me/"));
      setForm(null);
      setRevision((x) => x + 1);
      setMessage("saved");
    } catch (error) {
      showError(error);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 2, flexWrap: "wrap", py: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t("title")}
          </Typography>
          <Typography id="language-label">{t("language")}</Typography>
          <TextField
            select
            size="small"
            slotProps={{ select: { labelId: "language-label" } }}
            value={i18n.language}
            onChange={(e) => void i18n.changeLanguage(e.target.value)}
            sx={{ bgcolor: "white", minWidth: 140 }}
          >
            {Object.entries(languages).map(([code, name]) => (
              <MenuItem key={code} value={code}>
                {name}
              </MenuItem>
            ))}
          </TextField>
          {user && (
            <Button
              color="inherit"
              onClick={async () => {
                try {
                  await api("auth/logout/", "POST");
                  setUser(null);
                  setData({});
                  setRows([]);
                  setForm(null);
                  setMessage("");
                } catch (error) {
                  showError(error);
                }
              }}
            >
              {t("logout")}
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <Typography color="text.secondary">{t("demoNotice")}</Typography>
          {message && (
            <Alert severity={message === "saved" ? "success" : "error"}>
              {t(message, { defaultValue: t("error") })}
            </Alert>
          )}
          {checking ? (
            <Typography role="status">{t("loading")}</Typography>
          ) : !user ? (
            <Paper sx={{ p: 3, maxWidth: 480 }}>
              <Stack component="form" spacing={2} onSubmit={authenticate}>
                <Typography component="h1" variant="h5">
                  {t(registering ? "register" : "login")}
                </Typography>
                <TextField
                  label={t("username")}
                  name="username"
                  required
                  autoComplete="username"
                />
                <TextField
                  label={t("password")}
                  name="password"
                  type="password"
                  required
                  autoComplete={
                    registering ? "new-password" : "current-password"
                  }
                />
                {registering && (
                  <>
                    <TextField
                      label={t("full_name")}
                      name="full_name"
                      required
                    />
                    <TextField
                      label={t("date_of_birth")}
                      name="date_of_birth"
                      type="date"
                      required
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  </>
                )}
                <Button variant="contained" type="submit" disabled={busy}>
                  {t(registering ? "register" : "login")}
                </Button>
                <Button
                  onClick={() => {
                    setRegistering(!registering);
                    setMessage("");
                  }}
                >
                  {t(registering ? "login" : "register")}
                </Button>
              </Stack>
            </Paper>
          ) : (
            <>
              <Typography>
                {user.username} · {t(user.role || "unauthorized")}
              </Typography>
              <Stack direction="row" useFlexGap flexWrap="wrap" gap={1}>
                {(staff
                  ? [...endpoints, "dispense", "profile"]
                  : ["patients", "prescriptions", "dispensings", "profile"]
                ).map((key) => (
                  <Button
                    key={key}
                    variant={page === key ? "contained" : "outlined"}
                    onClick={() => changePage(key)}
                  >
                    {t(key)}
                  </Button>
                ))}
              </Stack>
              <Typography component="h1" variant="h4">
                {t(page)}
              </Typography>
              {page === "profile" ? (
                <>
                  <Typography>
                    {user.first_name} {user.last_name} · {user.email}
                  </Typography>
                  <Button
                    onClick={() => {
                      setForm({
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                      });
                      setFields([]);
                    }}
                  >
                    {t("edit")}
                  </Button>
                </>
              ) : page === "dispense" ? (
                <Button variant="contained" onClick={() => startForm()}>
                  {t("dispense")}
                </Button>
              ) : (
                <>
                  <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
                    <TextField
                      label={t("search")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      disabled={busy}
                      onClick={() => setRevision((x) => x + 1)}
                    >
                      {t("refresh")}
                    </Button>
                    {staff && resources[page] && (
                      <Button onClick={() => startForm()}>{t("create")}</Button>
                    )}
                  </Stack>
                  {busy ? (
                    <Typography role="status">{t("loading")}</Typography>
                  ) : rows.length === 0 ? (
                    <Typography>{t("empty")}</Typography>
                  ) : (
                    rows.map((row) => (
                      <Paper key={row.id} sx={{ p: 2 }}>
                        <Stack spacing={1}>
                          <Typography variant="h6" component="h2">
                            {label(row)}
                          </Typography>
                          {row.medication_name && (
                            <Typography>{row.medication_name}</Typography>
                          )}
                          {Object.entries(row)
                            .filter(
                              ([key]) =>
                                ![
                                  "id",
                                  "user",
                                  "lines",
                                  "medication_name",
                                  "patient_name",
                                  "name",
                                  "full_name",
                                  "reference",
                                  "pharmacist",
                                ].includes(key),
                            )
                            .map(([key, value]) => (
                              <Typography key={key} variant="body2">
                                {t(key)}:{" "}
                                {key === "dispensed_at"
                                  ? new Date(String(value)).toLocaleString(
                                      i18n.language,
                                    )
                                  : typeof value === "boolean"
                                    ? t(value ? "yes" : "no")
                                    : key === "status"
                                      ? t(String(value))
                                      : resources[page]?.find(
                                            (f) => f.name === key,
                                          )?.relation
                                        ? label(
                                            (
                                              data[
                                                resources[page].find(
                                                  (f) => f.name === key,
                                                )!.relation!
                                              ] || []
                                            ).find((x) => x.id === value) || {
                                              id: value,
                                            },
                                          )
                                        : String(value ?? "—")}
                              </Typography>
                            ))}
                          {row.patient_name && (
                            <Typography>
                              {t("patient")}: {row.patient_name}
                            </Typography>
                          )}
                          {row.lines?.map((line: RecordData) => (
                            <Typography key={line.id}>
                              {line.medication_name} ·{" "}
                              {t("quantity_prescribed")}:{" "}
                              {line.quantity_prescribed} · {t("remaining")}:{" "}
                              {line.remaining} · {line.directions}
                            </Typography>
                          ))}
                          {staff && editable.includes(page) && (
                            <Button onClick={() => startForm(row)}>
                              {t("edit")}
                            </Button>
                          )}
                        </Stack>
                      </Paper>
                    ))
                  )}
                </>
              )}
              {form && (
                <Paper sx={{ p: 3 }}>
                  <Stack
                    component="form"
                    spacing={2}
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (page === "dispense") setConfirm(true);
                      else void save();
                    }}
                  >
                    {(resources[page] || []).map((field) =>
                      input(field, form, (key, value) =>
                        setForm({
                          ...form,
                          [key]: value,
                          ...(key === "patient"
                            ? { prescription_line: "" }
                            : {}),
                        }),
                      ),
                    )}
                    {page === "prescriptions" && (
                      <>
                        {lines.map((line, index) => (
                          <Box key={index}>
                            <Stack spacing={2} sx={{ my: 2 }}>
                              {[
                                { name: "medication", relation: "medications" },
                                { name: "quantity_prescribed", type: "number" },
                                { name: "directions" },
                              ].map((field) =>
                                input(field, line, (key, value) =>
                                  setLines(
                                    lines.map((l, i) =>
                                      i === index ? { ...l, [key]: value } : l,
                                    ),
                                  ),
                                ),
                              )}
                              <Button
                                disabled={lines.length === 1}
                                onClick={() =>
                                  setLines(lines.filter((_, i) => i !== index))
                                }
                              >
                                {t("remove")}
                              </Button>
                            </Stack>
                          </Box>
                        ))}
                        <Button
                          onClick={() =>
                            setLines([
                              ...lines,
                              {
                                medication: "",
                                quantity_prescribed: 1,
                                directions: "",
                              },
                            ])
                          }
                        >
                          {t("addLine")}
                        </Button>
                      </>
                    )}
                    <Stack direction="row" gap={2}>
                      <Button variant="contained" type="submit" disabled={busy}>
                        {t("save")}
                      </Button>
                      <Button onClick={() => setForm(null)}>
                        {t("cancel")}
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
            </>
          )}
        </Stack>
      </Container>
      <Dialog open={confirm} onClose={() => setConfirm(false)}>
        <DialogTitle>{t("dispense")}</DialogTitle>
        <DialogContent>{t("confirm")}</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(false)}>{t("cancel")}</Button>
          <Button disabled={busy} onClick={() => void save()}>
            {t("dispense")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
