import { test, expect } from "@playwright/test";

test("create a patient and prescription, then dispense the prescribed quantity", async ({
  page,
}) => {
  test.skip(
    !process.env.DEMO_PASSWORD,
    "Set DEMO_PASSWORD for the local pharmacist account.",
  );
  const unique = String(Date.now());
  const name = "Prescription Demo " + unique;
  await page.goto("/");
  await page.getByLabel("Username").fill("pharmacist_demo");
  await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Patients", exact: true }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Reference", exact: true })
    .fill("E2E-P-" + unique);
  await page.getByLabel("Full name", { exact: false }).fill(name);
  await page.getByLabel("Birth date", { exact: false }).fill("2000-01-01");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved successfully")).toBeVisible();
  await page.getByRole("link", { name: "Prescriptions", exact: true }).click();
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Reference", exact: true })
    .fill("E2E-RX-" + unique);
  await page.getByRole("combobox", { name: /^Patient/ }).click();
  await page.getByRole("option", { name, exact: true }).click();
  await page.getByRole("combobox", { name: /^Doctor/ }).click();
  await page.getByRole("option", { name: "Demo Doctor", exact: true }).click();
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Qyzylorda",
  });
  await page.getByLabel("Issued on", { exact: false }).fill(today);
  await page.getByLabel("Valid until", { exact: false }).fill("2030-01-01");
  await page.getByRole("combobox", { name: /^Medication/ }).click();
  await page
    .getByRole("option", { name: /Demo Prescription Medicine/ })
    .click();
  await page.getByRole("spinbutton", { name: /Prescribed quantity/ }).fill("2");
  await page
    .getByLabel("Directions", { exact: false })
    .fill("Fictional demonstration only");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved successfully")).toBeVisible();
  await page.getByRole("link", { name: "Dispense", exact: true }).click();
  await page
    .getByRole("button", { name: "Dispense", exact: true })
    .last()
    .click();
  await page.getByRole("combobox", { name: /^Patient/ }).click();
  await page.getByRole("option", { name, exact: true }).click();
  await page.getByRole("combobox", { name: /^Batch/ }).click();
  await page
    .getByRole("option", { name: /Demo Prescription Medicine/ })
    .click();
  await page.getByRole("combobox", { name: /^Prescription line/ }).click();
  await page
    .getByRole("option", { name: new RegExp("E2E-RX-" + unique) })
    .click();
  await page.getByRole("spinbutton", { name: /^Quantity/ }).fill("2");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .getByRole("dialog")
    .last()
    .getByRole("button", { name: "Dispense", exact: true })
    .click();
  await expect(page.getByText("Saved successfully")).toBeVisible();
  await page.getByRole("link", { name: "Prescriptions", exact: true }).click();
  await page.getByLabel("Search").fill("E2E-RX-" + unique);
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
});
