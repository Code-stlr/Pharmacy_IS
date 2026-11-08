import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function signIn(page: any, username: string) {
  await page.goto("/");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Overview", exact: true }),
  ).toBeVisible();
}

test("admin creates edits and deletes a user and catalog record with confirmations", async ({
  page,
}) => {
  test.skip(!process.env.DEMO_PASSWORD, "Set local demo credentials.");
  const unique = String(Date.now()),
    username = "admin_e2e_" + unique;
  await signIn(page, "admin_demo");
  await page.getByRole("link", { name: "Admin panel", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByRole("button", { name: "Create Users", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Username", exact: true })
    .fill(username);
  await dialog
    .getByLabel("Password", { exact: false })
    .fill("Admin-browser-only-5893!");
  await dialog.getByRole("combobox", { name: /^Role/ }).click();
  await page.getByRole("option", { name: "Pharmacist", exact: true }).click();
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  let row = page.getByRole("row").filter({ hasText: username });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  dialog = page.getByRole("dialog");
  await dialog
    .getByRole("textbox", { name: "Email", exact: true })
    .fill("updated@example.test");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(row).toContainText("updated@example.test");
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(
    page.getByRole("dialog").getByText(username, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(row).toHaveCount(0);
  await page.getByRole("tab", { name: "Categories", exact: true }).click();
  await page
    .getByRole("button", { name: "Create Categories", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Admin category " + unique);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  row = page.getByRole("row").filter({ hasText: "Admin category " + unique });
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Updated category " + unique);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save", exact: true })
    .click();
  row = page.getByRole("row").filter({ hasText: "Updated category " + unique });
  await row.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(row).toHaveCount(0);
  await page
    .getByRole("row")
    .filter({ hasText: "Demo medicines" })
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByText(
      "This record is in use. Keep it for history, or deactivate the account or medication instead.",
    ),
  ).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    results.violations.filter((item) =>
      ["serious", "critical"].includes(item.impact || ""),
    ),
  ).toEqual([]);
  for (const [language, heading] of [
    ["Русский", "Доступ и управление"],
    ["Қазақша", "Қолжетімділік және басқару"],
    ["English", "Access & administration"],
  ]) {
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: language, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
});

test("non-admin direct route is denied and mobile navigation works", async ({
  page,
}) => {
  test.skip(!process.env.DEMO_PASSWORD, "Set local demo credentials.");
  await signIn(page, "pharmacist_demo");
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Access restricted", exact: true }),
  ).toBeVisible();
  expect((await page.request.get("/api/admin/users/")).status()).toBe(403);
  await page
    .getByRole("button", { name: "Back to workspace", exact: true })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page.getByRole("link", { name: "Patients", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Patients", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Admin panel", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("link", { name: "Patients", exact: true }),
  ).toHaveCount(0);
});
