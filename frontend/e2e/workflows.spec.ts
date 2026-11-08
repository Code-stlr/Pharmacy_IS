import { test, expect } from "@playwright/test";

test("patient registration, profile update, isolation and all three languages", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create patient account" }).click();
  await page.getByLabel("Username", { exact: false }).fill("e2e_" + Date.now());
  await page
    .getByLabel("Password", { exact: false })
    .fill("Browser-Patient-5829!");
  await page
    .getByLabel("Full name", { exact: false })
    .fill("Browser Demo Patient");
  await page.getByLabel("Birth date", { exact: false }).fill("2000-01-01");
  await page.getByRole("button", { name: "Create patient account" }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Inventory batches" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "My profile" }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("First name").fill("Browser");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Saved successfully")).toBeVisible();
  for (const [lang, label] of [
    ["Русский", "Мой профиль"],
    ["Қазақша", "Менің профилім"],
    ["English", "My profile"],
  ]) {
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: lang, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: label, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
});

test("pharmacist searches and dispenses OTC with persistent stock update", async ({
  page,
}) => {
  test.skip(
    !process.env.DEMO_PASSWORD,
    "Set DEMO_PASSWORD after creating local demo accounts.",
  );
  await page.goto("/");
  await page.getByLabel("Username").fill("pharmacist_demo");
  await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await page.getByRole("link", { name: "Medications", exact: true }).click();
  const before = await (await page.request.get("/api/batches/")).json();
  const otc = before.find(
    (batch: any) => batch.medication_name === "Demo OTC Medicine",
  );
  await page.getByLabel("Search").fill("Demo OTC");
  await expect(page.getByText(/Demo OTC Medicine.*5 mg/)).toBeVisible();
  await page.getByRole("link", { name: "Dispense", exact: true }).click();
  await page
    .getByRole("button", { name: "Dispense", exact: true })
    .last()
    .click();
  await page.getByLabel("Patient", { exact: false }).last().click();
  await page.getByRole("option", { name: "Demo Patient One" }).click();
  await page.getByRole("combobox", { name: /^Batch/ }).click();
  await page.getByRole("option", { name: /Demo OTC Medicine/ }).click();
  await page.getByRole("spinbutton", { name: /^Quantity/ }).fill("1");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Dispense", exact: true })
    .click();
  await expect(page.getByText("Saved successfully")).toBeVisible();
  const after = await (await page.request.get("/api/batches/")).json();
  expect(after.find((batch: any) => batch.id === otc.id).stock_quantity).toBe(
    otc.stock_quantity - 1,
  );
  await page
    .getByRole("link", { name: "Dispensing history", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "Demo OTC Medicine" }).first(),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole("heading", { name: "Dispensing history", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/mobile-history.png",
    fullPage: true,
  });
});
