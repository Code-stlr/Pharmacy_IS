import { useState, type FormEvent } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { neonAuth } from "./neon";

export default function ChangePassword({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [mismatch, setMismatch] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError(""); setMismatch(false);
    if (values.new_password !== values.confirm_password) { setMismatch(true); return; }
    setBusy(true);
    try {
      const auth = await neonAuth();
      if (!auth) throw new Error(t("error"));
      const result = await auth.changePassword({ currentPassword: String(values.current_password), newPassword: String(values.new_password), revokeOtherSessions: true });
      if (result.error) throw new Error(result.error.message);
      onChanged(); onClose();
    } catch (value) { setError(value instanceof Error ? value.message : t("error")); }
    finally { setBusy(false); }
  }
  return <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
    <form onSubmit={submit} aria-busy={busy}>
      <DialogTitle>{t("changePassword")}</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        <p>{t("changePasswordHelp")}</p>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label={t("currentPassword")} name="current_password" type="password" autoComplete="current-password" required fullWidth disabled={busy} slotProps={{ htmlInput: { maxLength: 128 } }} />
        <TextField label={t("newPassword")} name="new_password" type="password" autoComplete="new-password" required fullWidth disabled={busy} slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }} />
        <TextField label={t("confirmPassword")} name="confirm_password" type="password" autoComplete="new-password" required fullWidth disabled={busy} error={mismatch} helperText={mismatch ? t("passwordMismatch") : undefined} onChange={() => setMismatch(false)} />
      </Stack></DialogContent>
      <DialogActions><Button type="button" onClick={onClose} disabled={busy}>{t("cancel")}</Button><Button variant="contained" type="submit" disabled={busy}>{t("changePassword")}</Button></DialogActions>
    </form>
  </Dialog>;
}
