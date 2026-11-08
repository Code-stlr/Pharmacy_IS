import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import "./i18n";
import "@fontsource-variable/inter";
import App from "./App";
const theme = createTheme({
  palette: {
    primary: { main: "#245746" },
    background: { default: "#f5f6f2" },
    text: { primary: "#182b25", secondary: "#66746b" },
    error: { main: "#a53335" },
  },
  typography: {
    fontFamily: '"Inter Variable", Inter, Arial, sans-serif',
    fontSize: 13,
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          textTransform: "none",
          minHeight: 44,
          fontWeight: 600,
          fontSize: 12,
          borderRadius: 8,
          paddingInline: 18,
        },
      },
    },
    MuiTextField: { defaultProps: { variant: "outlined" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { fontSize: 13, background: "#fff" },
        notchedOutline: { borderColor: "#d9e1d3" },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { fontSize: 13 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 18 } } },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          padding: "27px 28px 18px",
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: "-.03em",
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: "10px 28px 24px" } },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: "18px 28px", borderTop: "1px solid #e1e7df" },
      },
    },
  },
});
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>,
);
