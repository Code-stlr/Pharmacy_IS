import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button, Drawer, IconButton, MenuItem, TextField } from "@mui/material";
import { NavLink } from "react-router-dom";
import { languages } from "./i18n";
import Icon from "./Icon";
import type { User } from "./api";

export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  return (
    <div className="language-control">
      <span id="language-label">{t("language")}</span>
      <TextField
        select
        size="small"
        value={i18n.language}
        slotProps={{ select: { labelId: "language-label" } }}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
      >
        {Object.entries(languages).map(([code, name]) => (
          <MenuItem key={code} value={code}>
            {name}
          </MenuItem>
        ))}
      </TextField>
    </div>
  );
}
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Icon name="cross" size={23} />
      </span>
      <span>
        pharmacy<span className="brand-is"> / IS</span>
        <small>INFORMATION SYSTEM</small>
      </span>
    </div>
  );
}
export default function Workspace({
  user,
  page,
  onLogout,
  children,
}: {
  user: User;
  page: string;
  onLogout: () => void;
  children: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const staff = user.role === "Admin" || user.role === "Pharmacist";
  const primary = staff
    ? [
        "overview",
        "patients",
        "medications",
        "batches",
        "prescriptions",
        "dispensings",
        "dispense",
      ]
    : ["overview", "patients", "prescriptions", "dispensings"];
  const nav = (keys: string[]) =>
    keys.map((key) => (
      <NavLink
        key={key}
        end
        to={key === "overview" ? "/" : "/" + key}
        onClick={() => setOpen(false)}
        className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
      >
        <Icon name={key} />
        <span>{t(key)}</span>
      </NavLink>
    ));
  const sidebar = (
    <div className="sidebar-content">
      <Brand />
      <div className="nav-label">{t("workspace")}</div>
      <nav aria-label={t("workspace")}>{nav(primary)}</nav>
      {staff && (
        <>
          <div className="nav-label">{t("referenceData")}</div>
          <nav aria-label={t("referenceData")}>
            {nav(["categories", "suppliers", "doctors"])}
          </nav>
        </>
      )}
      {user.role === "Admin" && (
        <>
          <div className="nav-label">{t("administration")}</div>
          <nav aria-label={t("administration")}>{nav(["admin"])}</nav>
        </>
      )}
      <div className="sidebar-bottom">
        <nav>{nav(["profile"])}</nav>
        <button className="nav-item logout" onClick={onLogout}>
          <Icon name="logout" />
          <span>{t("logout")}</span>
        </button>
        <div className="sidebar-notice">
          <span className="status-dot" />
          {t("demoNotice")}
        </div>
      </div>
    </div>
  );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        {t("skipContent")}
      </a>
      <aside className="desktop-sidebar">{sidebar}</aside>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 258 } } }}
      >
        {sidebar}
      </Drawer>
      <div className="workspace-area">
        <header className="topbar">
          <div className="breadcrumb">
            <IconButton
              className="menu-button"
              aria-label={t("openMenu")}
              onClick={() => setOpen(true)}
            >
              <Icon name="menu" />
            </IconButton>
            <span>{t("workspace")}</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{t(page)}</strong>
          </div>
          <div className="topbar-right">
            <span className="today">
              {new Intl.DateTimeFormat(i18n.language, {
                day: "numeric",
                month: "short",
                year: "numeric",
              }).format(new Date())}
            </span>
            <LanguageSelect />
            <span className="avatar" title={user.username}>
              {user.username.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>
        <main id="main" className="main-content">
          {children}
          <footer className="workspace-footer">
            <span>Pharmacy IS</span>
            <span>
              {user.username} · {t(user.role || "unauthorized")}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{t("workspace")}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
