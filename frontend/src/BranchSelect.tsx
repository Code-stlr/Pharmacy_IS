import { useEffect, useRef, useState } from "react";
import { Alert, Button, MenuItem, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Branch } from "./api";
import { branchCoordinates, nearestBranch } from "./nearest-branch";

export default function BranchSelect({ branches, value, onChange, disabled = false }: {
  branches: Branch[]; value: number | ""; onChange: (value: number | "") => void; disabled?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const [locating, setLocating] = useState(false), [message, setMessage] = useState("");
  const [result, setResult] = useState<{ id: number; distanceKm: number } | null>(null);
  const mounted = useRef(true);
  const requestVersion = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const active = branches.filter((branch) => branch.is_active);
  const mapped = active.filter((branch) => branchCoordinates(branch));
  const selected = active.find((branch) => branch.id === value);

  function locate() {
    if (disabled || locating) return;
    setMessage(""); setResult(null);
    if (!navigator.geolocation) { setMessage("locationUnsupported"); return; }
    if (window.isSecureContext === false) { setMessage("locationNeedsHttps"); return; }
    setLocating(true);
    const version = ++requestVersion.current;
    navigator.geolocation.getCurrentPosition((position) => {
      if (!mounted.current || version !== requestVersion.current) return;
      const nearest = nearestBranch(active, position.coords.latitude, position.coords.longitude);
      setLocating(false);
      if (!nearest) { setMessage("branchLocationsMissing"); return; }
      onChange(nearest.branch.id);
      setResult({ id: nearest.branch.id, distanceKm: nearest.distanceKm });
    }, (error) => {
      if (!mounted.current || version !== requestVersion.current) return;
      setLocating(false);
      setMessage(error.code === 1 ? "locationDenied" : error.code === 3 ? "locationTimeout" : "locationUnavailable");
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
  }

  return <Stack spacing={1.5}>
    <TextField select fullWidth label={t("preferred_branch")} name="preferred_branch" value={value} disabled={disabled}
      helperText={selected?.address || t("preferredBranchHelp")}
      onChange={(event) => { requestVersion.current += 1; setLocating(false); onChange(event.target.value === "" ? "" : Number(event.target.value)); setResult(null); setMessage(""); }}>
      <MenuItem value="">{t("none")}</MenuItem>
      {active.map((branch) => <MenuItem key={branch.id} value={branch.id} sx={{ whiteSpace: "normal" }}>{branch.name}{branch.address ? " · " + branch.address : ""}</MenuItem>)}
    </TextField>
    <span>{t("locationPrivacy")}</span>
    <Button type="button" variant="outlined" onClick={locate} disabled={disabled || locating || !mapped.length}>{t(locating ? "findingLocation" : "useMyLocation")}</Button>
    {!mapped.length && <Alert severity="info">{t("branchLocationsMissing")}</Alert>}
    {mapped.length > 0 && mapped.length < active.length && <Alert severity="info">{t("branchLocationsPartial")}</Alert>}
    {message && <Alert severity="warning">{t(message)}</Alert>}
    {result && result.id === value && <Alert severity="success" role="status">{t("nearestBranchSelected", { name: selected?.name, distance: new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(result.distanceKm) })}</Alert>}
  </Stack>;
}
