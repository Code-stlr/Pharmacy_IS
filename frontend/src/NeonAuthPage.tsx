import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Button, Checkbox, FormControlLabel, TextField } from "@mui/material";
import { api, ApiError, type Branch, type User } from "./api";
import { neonAuth } from "./neon";
import { Brand, LanguageSelect } from "./Workspace";
import BranchSelect from "./BranchSelect";

type Mode = "login" | "register" | "verify-email" | "forgot-password" | "reset-password" | "complete-account" | "link-account";
const modes: Mode[] = ["login", "register", "verify-email", "forgot-password", "reset-password", "complete-account", "link-account"];

export default function NeonAuthPage({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const { t } = useTranslation(), location = useLocation(), navigate = useNavigate();
  const route = location.pathname.slice(1) as Mode;
  const mode: Mode = modes.includes(route) ? route : "login";
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false), [checking, setChecking] = useState(true);
  const [error, setError] = useState(new URLSearchParams(location.search).has("error") ? t("googleSignInFailed") : ""), [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0), [branches, setBranches] = useState<Branch[]>([]);
  const [preferredBranch, setPreferredBranch] = useState<number | "">("");
  const [passwordMismatch, setPasswordMismatch] = useState(false);

  function showError(value: unknown) {
    setError(value instanceof ApiError ? t(value.code, { defaultValue: t("error") }) : value instanceof Error ? value.message : t("error"));
  }
  function go(next: Mode) { setError(""); setNotice(""); setPasswordMismatch(false); navigate("/" + next); }
  async function openWorkspace() {
    try { onAuthenticated(await api("auth/me/")); }
    catch (value) {
      if (value instanceof ApiError && value.code === "account_setup_required") go("complete-account");
      else throw value;
    }
  }
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const auth = await neonAuth();
        const result = await auth?.getSession();
        if (result?.error) throw new Error(result.error.message);
        if (active && result?.data?.user) {
          setEmail(result.data.user.email);
          if (result.data.user.emailVerified) await openWorkspace();
          else go("verify-email");
        }
      } catch (value) { if (active) showError(value); }
      finally { if (active) setChecking(false); }
    })();
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (mode === "complete-account") void api("branches/").then(setBranches).catch(showError);
  }, [mode]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown > 0]);

  async function sendCode() {
    if (busy || cooldown || !email) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const auth = await neonAuth();
      if (!auth) throw new Error(t("error"));
      const result = await auth.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      if (result.error) throw new Error(result.error.message);
      setCooldown(60); setNotice(t("verificationSent"));
    } catch (value) { showError(value); }
    finally { setBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setError(""); setNotice("");
    try {
      if ((mode === "register" || mode === "reset-password") && data.password !== data.confirm_password) {
        setPasswordMismatch(true);
        throw new Error(t("passwordMismatch"));
      }
      const auth = await neonAuth();
      if (!auth) throw new Error(t("error"));
      if (mode === "complete-account" || mode === "link-account") {
        const payload = mode === "complete-account" ? { ...data, preferred_branch: data.preferred_branch || null } : data;
        onAuthenticated(await api(mode === "complete-account" ? "auth/complete/" : "auth/link-legacy/", "POST", payload));
        return;
      }
      if (mode === "register") {
        const result = await auth.signUp.email({ email, password: String(data.password), name: String(data.full_name) });
        if (result.error) throw new Error(result.error.message);
        go("verify-email"); setCooldown(60); setNotice(t("verificationSent"));
      } else if (mode === "login") {
        const result = await auth.signIn.email({ email, password: String(data.password), rememberMe: data.remember === "on" });
        if (result.error) {
          if (result.error.code === "EMAIL_NOT_VERIFIED") { go("verify-email"); return; }
          throw new Error(result.error.message);
        }
        await openWorkspace();
      } else if (mode === "verify-email") {
        const result = await auth.emailOtp.verifyEmail({ email, otp: String(data.otp) });
        if (result.error) throw new Error(result.error.message);
        go("login"); setNotice(t("emailVerified"));
      } else if (mode === "forgot-password") {
        const result = await auth.emailOtp.requestPasswordReset({ email });
        if (result.error) throw new Error(result.error.message);
        go("reset-password"); setNotice(t("resetSent"));
      } else if (mode === "reset-password") {
        const result = await auth.emailOtp.resetPassword({ email, otp: String(data.otp), password: String(data.password) });
        if (result.error) throw new Error(result.error.message);
        go("login"); setNotice(t("passwordReset"));
      }
    } catch (value) { showError(value); }
    finally { setBusy(false); }
  }

  async function google() {
    setBusy(true); setError("");
    try {
      const auth = await neonAuth();
      const result = await auth?.signIn.social({ provider: "google", callbackURL: window.location.origin + "/login" });
      if (result?.error) throw new Error(result.error.message);
    } catch (value) { showError(value); }
    finally { setBusy(false); }
  }
  const title = { login: "login", register: "register", "verify-email": "verifyEmail", "forgot-password": "forgotPassword", "reset-password": "resetPassword", "complete-account": "completeAccount", "link-account": "linkAccount" }[mode];
  const setup = mode === "complete-account" || mode === "link-account";
  return <div className="auth-page">
    <section className="auth-story"><Brand /><div className="auth-editorial"><span className="eyebrow">{t("connectedCare")}</span><h1>{t("authHeadline")}<em>{t("authAccent")}</em></h1><p>{t("authDescription")}</p></div><span className="auth-edition">01 / PHARMACY IS</span></section>
    <section className="auth-form-side"><div className="auth-language"><LanguageSelect /></div>
      <form key={mode} onSubmit={submit} className="auth-form" aria-busy={busy || checking}>
        <h2>{t(title)}</h2>
        {mode === "login" && <p>{t("allRolesSignIn")}</p>}
        {mode === "register" && <p>{t("createAccountHelp")}</p>}
        {checking && <p role="status">{t("loading")}</p>}
        {error && <Alert severity="error">{error}</Alert>}
        {notice && <Alert severity="success" role="status">{notice}</Alert>}
        {mode === "verify-email" && <p>{t("verificationHelp")}</p>}
        {setup && <p>{t("accountSetupHelp")}</p>}
        {!setup && <TextField label={t("email")} name="email" type="email" autoComplete="email" required fullWidth value={email} onChange={(event) => setEmail(event.target.value)} />}
        {(mode === "register" || mode === "complete-account") && <TextField label={t("full_name")} name="full_name" autoComplete="name" required fullWidth />}
        {mode === "complete-account" && <>
          <TextField label={t("date_of_birth")} name="date_of_birth" type="date" required fullWidth slotProps={{ inputLabel: { shrink: true } }} />
          <BranchSelect branches={branches} value={preferredBranch} onChange={setPreferredBranch} disabled={busy || checking} />
        </>}
        {mode === "link-account" && <TextField label={t("username")} name="username" autoComplete="username" required fullWidth />}
        {(mode === "verify-email" || mode === "reset-password") && <TextField label={t("verificationCode")} name="otp" autoComplete="one-time-code" required fullWidth slotProps={{ htmlInput: { inputMode: "numeric", pattern: "[0-9]{6}", maxLength: 6 } }} />}
        {["login", "register", "reset-password", "link-account"].includes(mode) && <TextField label={t("password")} name="password" type="password" autoComplete={mode === "register" || mode === "reset-password" ? "new-password" : "current-password"} required fullWidth onChange={() => setPasswordMismatch(false)} slotProps={{ htmlInput: { minLength: mode === "register" || mode === "reset-password" ? 8 : undefined } }} />}
        {(mode === "register" || mode === "reset-password") && <TextField label={t("confirmPassword")} name="confirm_password" type="password" autoComplete="new-password" required fullWidth error={passwordMismatch} helperText={passwordMismatch ? t("passwordMismatch") : undefined} onChange={() => setPasswordMismatch(false)} />}
        {mode === "login" && <FormControlLabel control={<Checkbox name="remember" defaultChecked />} label={t("rememberMe")} />}
        <Button className="auth-submit" fullWidth variant={mode === "login" ? "outlined" : "contained"} type="submit" disabled={busy || checking}>{t(mode === "verify-email" ? "verifyEmailAction" : mode === "forgot-password" ? "sendResetCode" : title)}</Button>
        {mode === "verify-email" && <Button disabled={busy || checking || cooldown > 0 || !email} onClick={() => void sendCode()}>{cooldown ? t("resendIn", { seconds: cooldown }) : t("resendVerification")}</Button>}
        {(mode === "login" || mode === "register") && <>
          <Button className="auth-google" variant="outlined" startIcon={<img src="/google-g.png" width="20" height="20" alt="" />} disabled={busy || checking} onClick={() => void google()}>{t("googleSignIn")}</Button>
          <div className="auth-account-prompt"><span>{t(mode === "login" ? "noAccount" : "alreadyAccount")}</span><Button disabled={busy} onClick={() => go(mode === "login" ? "register" : "login")}>{t(mode === "login" ? "register" : "login")}</Button></div>
        </>}
        {mode === "login" && <Button disabled={busy} onClick={() => go("forgot-password")}>{t("forgotPassword")}</Button>}
        {mode === "login" && <details className="auth-staff-help"><summary>{t("staffSignIn")}</summary><p>{t("staffSignInHelp")}</p></details>}
        {setup ? <>
          <Button disabled={busy} onClick={() => go(mode === "complete-account" ? "link-account" : "complete-account")}>{t(mode === "complete-account" ? "linkAccount" : "newPatientAccount")}</Button>
          <Button disabled={busy} onClick={async () => { setBusy(true); try { const auth = await neonAuth(); const result = await auth?.signOut(); if (result?.error) throw new Error(result.error.message); go("login"); } catch (value) { showError(value); } finally { setBusy(false); } }}>{t("logout")}</Button>
        </> : mode !== "login" && mode !== "register" && <Button disabled={busy} onClick={() => go("login")}>{t("login")}</Button>}
      </form><p className="auth-disclaimer">{t("demoNotice")}</p>
    </section>
  </div>;
}
