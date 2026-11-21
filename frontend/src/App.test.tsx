import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "./i18n";
import i18n from "./i18n";
import App from "./App";
import { MemoryRouter } from "react-router-dom";
import { messages } from "./locales";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  void i18n.changeLanguage("en");
});
function loggedOut() {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(async (url: string) =>
        url.includes("auth/me")
          ? { ok: false, status: 403, json: async () => ({}) }
          : { ok: true, json: async () => ({ csrfToken: "test" }) },
      ),
  );
}
function RoutedApp() {
  return (
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
}
test("login screen switches language to Kazakh", async () => {
  loggedOut();
  render(<RoutedApp />);
  expect(
    await screen.findByRole("button", { name: "Sign in" }),
  ).toBeInTheDocument();
  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: "Қазақша" }));
  expect(
    await screen.findByRole("button", { name: "Кіру" }),
  ).toBeInTheDocument();
  expect(document.documentElement.lang).toBe("kk");
});
test("registration shows required patient fields", async () => {
  loggedOut();
  render(<RoutedApp />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Create patient account" }),
  );
  expect(screen.getByLabelText(/Full name/)).toBeRequired();
  expect(screen.getByLabelText(/Birth date/)).toBeRequired();
});
test("patient navigation excludes inventory and dispensing actions", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      json: async () =>
        url.includes("auth/me")
          ? {
              id: 1,
              username: "patient",
              role: "Patient",
              first_name: "",
              last_name: "",
              email: "",
            }
          : [],
    })),
  );
  render(<RoutedApp />);
  expect(await screen.findByText("patient · Patient")).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Dispense" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "Inventory batches" }),
  ).not.toBeInTheDocument();
});
test("all dictionaries have identical keys and no empty values", () => {
  const keys = Object.keys(messages.en).sort();
  for (const dictionary of Object.values(messages)) {
    expect(Object.keys(dictionary).sort()).toEqual(keys);
    expect(
      Object.values(dictionary).every((value) => value.trim().length > 0),
    ).toBe(true);
  }
});

const mainBranch = { id: 1, code: "MAIN", name: "Main Branch", is_active: true };
const northBranch = { id: 2, code: "NORTH", name: "North Branch", is_active: true };
const staffUser = { id: 1, username: "staff", first_name: "", last_name: "", email: "" };
const response = (body: unknown) => ({ ok: true, json: async () => body });

test("sign out during a workspace load leaves sign in available", async () => {
  const fetchApi = vi.fn(async (url: string) => {
    if (url.endsWith("auth/me/"))
      return response({ ...staffUser, role: "Pharmacist", active_branch: mainBranch });
    if (url.endsWith("auth/csrf/")) return response({ csrfToken: "test" });
    if (url.endsWith("auth/logout/")) return response({ status: "ok" });
    if (url.endsWith("batches/")) return new Promise<never>(() => {});
    return response([]);
  });
  vi.stubGlobal("fetch", fetchApi);
  render(<RoutedApp />);
  const signOut = await screen.findByRole("button", { name: "Sign out" });
  await waitFor(() => expect(fetchApi).toHaveBeenCalledWith("/api/batches/", expect.anything()));
  fireEvent.click(signOut);
  expect(await screen.findByRole("button", { name: "Sign in" })).toBeEnabled();
});

test("admin branch switches replace visible stock and pin requests to that branch", async () => {
  const fetchApi = vi.fn(async (url: string, options?: RequestInit) => {
    if (url.endsWith("auth/me/"))
      return response({ ...staffUser, role: "Admin", active_branch: mainBranch });
    if (url.endsWith("auth/branch/"))
      return response({ ...staffUser, role: "Admin", active_branch: northBranch });
    if (url.endsWith("auth/csrf/")) return response({ csrfToken: "test" });
    if (url.endsWith("branches/")) return response([mainBranch, northBranch]);
    if (url.startsWith("/api/batches/")) {
      const branch = new Headers(options?.headers).get("X-Pharmacy-Branch");
      return response([{ id: 1, lot_number: branch === "2" ? "NORTH-LOT" : "MAIN-LOT" }]);
    }
    return response([]);
  });
  vi.stubGlobal("fetch", fetchApi);
  render(<MemoryRouter initialEntries={["/batches"]}><App /></MemoryRouter>);
  expect(await screen.findByText("MAIN-LOT")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Switch branch.*Main Branch/ }));
  fireEvent.click(screen.getByRole("menuitem", { name: "North Branch · NORTH" }));
  expect(await screen.findByText("NORTH-LOT")).toBeInTheDocument();
  expect(screen.queryByText("MAIN-LOT")).not.toBeInTheDocument();
  expect(fetchApi).toHaveBeenCalledWith("/api/batches/?search=", expect.objectContaining({
    headers: expect.objectContaining({ "X-Pharmacy-Branch": "2" }),
  }));
});

test("patient detail loads shared allergies and dispensing from another branch", async () => {
  const patient = { id: 7, full_name: "Demo Patient", reference: "P-7", allergy_names: ["Aspirin"] };
  const fetchApi = vi.fn(async (url: string) => {
    if (url.endsWith("auth/me/"))
      return response({ ...staffUser, role: "Pharmacist", active_branch: northBranch });
    if (url.endsWith("patients/7/")) return response(patient);
    if (url.startsWith("/api/patients/")) return response([patient]);
    if (url.endsWith("dispensings/?patient=7"))
      return response([{ id: 9, branch_name: "Main Branch", medication_name: "Sample medication" }]);
    return response([]);
  });
  vi.stubGlobal("fetch", fetchApi);
  render(<MemoryRouter initialEntries={["/patients"]}><App /></MemoryRouter>);
  fireEvent.click(await screen.findByRole("button", { name: "View history" }));
  const history = within(screen.getByRole("dialog", { name: "Shared patient history" }));
  expect(await history.findByText("Main Branch")).toBeInTheDocument();
  expect(history.getByText(/Aspirin/)).toBeInTheDocument();
  expect(fetchApi).toHaveBeenCalledWith("/api/prescriptions/?patient=7", expect.objectContaining({
    headers: expect.objectContaining({ "X-Pharmacy-Branch": "2" }),
  }));
});
