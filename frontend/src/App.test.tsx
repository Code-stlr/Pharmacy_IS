import { afterEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "./i18n";
import i18n from "./i18n";
import App from "./App";
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
test("login screen switches language to Kazakh", async () => {
  loggedOut();
  render(<App />);
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
  render(<App />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Create patient account" }),
  );
  expect(screen.getByLabelText(/Full name/)).toBeRequired();
  expect(screen.getByLabelText(/Birth date/)).toBeRequired();
});
test("patient navigation excludes inventory and dispensing actions", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockImplementation(async (url: string) => ({
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
  render(<App />);
  expect(await screen.findByText("patient · Patient")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Dispense" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Inventory batches" }),
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
