import { test, expect, Page } from "@playwright/test";

// ============================================================
// W13-01: крайние случаи контроля доступа (RBAC), браузерные тесты
// Автор: Daulet Yerdos (Student 5, QA)
// Что уже покрывает admin.spec.ts: фармацевт на /admin (экран отказа + 403 API).
// Здесь только то, чего там нет: пациент, подпути, регистр, параметры,
// подмена localStorage, API с живой сессией, кнопка «назад» после выхода.
// Пароль берётся из переменной окружения DEMO_PASSWORD.
// ============================================================

const ADMIN_PANEL = "Access & administration";
const RESTRICTED = "Access restricted";

// Тот же вход, что в admin.spec.ts
async function signIn(page: Page, username: string) {
  await page.goto("/");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Overview", exact: true }),
  ).toBeVisible();
}

// CHECK: единственное место, где я не видел реальную кнопку выхода
async function signOut(page: Page) {
  await page
    .getByRole("button", { name: /sign out/i })
    .or(page.getByRole("link", { name: /sign out/i }))
    .first()
    .click();
  await expect(page.getByLabel("Username")).toBeVisible();
}

const adminHeading = (page: Page) =>
  page.getByRole("heading", { name: ADMIN_PANEL, exact: true });
const restrictedHeading = (page: Page) =>
  page.getByRole("heading", { name: RESTRICTED, exact: true });

test.beforeEach(() => {
  test.skip(!process.env.DEMO_PASSWORD, "Set local demo credentials.");
});

// EC-00 (контроль): админ видит админ-панель, значит заголовок выбран верно
test("EC-00 control: admin sees the admin panel heading", async ({ page }) => {
  await signIn(page, "admin_demo");
  await page.goto("/admin");
  await expect(adminHeading(page)).toBeVisible();
});

// EC-01: гость упёрся в /admin, потом вошёл пациентом
test("EC-01: signing in as patient after a blocked /admin visit does not open the admin panel", async ({
  page,
}) => {
  await page.goto("/admin"); // гость
  await signIn(page, "patient_demo");
  await page.goto("/admin");
  await expect(restrictedHeading(page)).toBeVisible();
  await expect(adminHeading(page)).toHaveCount(0);
});

// EC-02: подпути, слэш и регистр для обеих ролей без прав
for (const user of ["patient_demo", "pharmacist_demo"]) {
  for (const path of ["/admin/", "/admin/users", "/Admin"]) {
    test(`EC-02: ${user} on ${path} does not see the admin panel`, async ({
      page,
    }) => {
      await signIn(page, user);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await expect(adminHeading(page)).toHaveCount(0);
    });
  }
}

// EC-03: пациент напрямую на /admin (в admin.spec.ts проверен только фармацевт)
test("EC-03: patient direct /admin shows Access restricted and no Admin panel link", async ({
  page,
}) => {
  await signIn(page, "patient_demo");
  await expect(
    page.getByRole("link", { name: "Admin panel", exact: true }),
  ).toHaveCount(0);
  await page.goto("/admin");
  await expect(restrictedHeading(page)).toBeVisible();
});

// EC-04: параметры в адресе не дают прав
test("EC-04: /admin?role=Admin does not raise patient privileges", async ({
  page,
}) => {
  await signIn(page, "patient_demo");
  await page.goto("/admin?role=Admin&admin=true");
  await expect(restrictedHeading(page)).toBeVisible();
  await expect(adminHeading(page)).toHaveCount(0);
});

// EC-05: подмена роли в браузерном хранилище не открывает админку
test("EC-05: tampering role=Admin in localStorage does not open the admin panel", async ({
  page,
}) => {
  await signIn(page, "patient_demo");
  await page.evaluate(() => {
    localStorage.setItem("role", "Admin");
    localStorage.setItem("user", JSON.stringify({ role: "Admin" }));
  });
  await page.goto("/admin");
  await expect(restrictedHeading(page)).toBeVisible();
  await expect(adminHeading(page)).toHaveCount(0);
});

// EC-06: API с живой сессией пациента: решает сервер, а не интерфейс
for (const resource of ["users", "medications", "patients"]) {
  test(`EC-06: patient session gets 403 on /api/admin/${resource}/`, async ({
    page,
  }) => {
    await signIn(page, "patient_demo");
    const response = await page.request.get(`/api/admin/${resource}/`);
    expect(response.status()).toBe(403);
  });
}

// EC-07: после выхода кнопка «назад» не возвращает админ-панель
test("EC-07: after Sign out the Back button does not restore the admin panel", async ({
  page,
}) => {
  await signIn(page, "admin_demo");
  await page.goto("/admin");
  await expect(adminHeading(page)).toBeVisible();
  await signOut(page);
  await page.goBack();
  await page.waitForLoadState("networkidle");
  await expect(adminHeading(page)).toHaveCount(0);
  expect((await page.request.get("/api/admin/users/")).status()).toBe(403);
});
