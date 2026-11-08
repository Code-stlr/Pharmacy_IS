import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("login is keyboard accessible and has no serious accessibility violations", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    results.violations.filter((item) =>
      ["serious", "critical"].includes(item.impact || ""),
    ),
  ).toEqual([]);
  await page.getByLabel("Username").focus();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password")).toBeFocused();
});

test("local workflows operate with all public network requests blocked", async ({
  page,
  context,
  baseURL,
}) => {
  test.skip(
    !process.env.DEMO_PASSWORD,
    "Set DEMO_PASSWORD for the isolated fixture accounts.",
  );
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return ["localhost", "127.0.0.1"].includes(url.hostname)
      ? route.continue()
      : route.abort();
  });
  await page.goto("/");
  await page.getByLabel("Username").fill("pharmacist_demo");
  await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByRole("link", { name: "Medications", exact: true }).click();
  await page.getByLabel("Search").fill("no-such-medication-acceptance");
  await expect(
    page.getByText("No records found", { exact: true }),
  ).toBeVisible();
  const health = await page.request.get(baseURL + "/api/health/");
  expect((await health.json()).status).toBe("ok");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".page-heading")).toHaveCSS("opacity", "1");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(
    results.violations.filter((item) =>
      ["serious", "critical"].includes(item.impact || ""),
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/mobile-empty-state.png",
    fullPage: true,
  });
});

test("network failure displays translated error and login failure does not authenticate", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("does-not-exist");
  await page.getByLabel("Password").fill("WrongPassword-5938!");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByText("Incorrect username or password")).toBeVisible();
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Русский", exact: true }).click();
  await expect(
    page.getByText("Неверное имя пользователя или пароль"),
  ).toBeVisible();
  await page.route("**/api/auth/login/", (route) => route.abort());
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await expect(page.getByText("Нет соединения.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Выйти", exact: true }),
  ).toHaveCount(0);
});
