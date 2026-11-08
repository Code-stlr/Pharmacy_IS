import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
const root = path.resolve(import.meta.dirname, "..");
const { chromium } = await import(
  pathToFileURL(path.join(root, "frontend/node_modules/playwright/index.mjs"))
);
const out = path.resolve(root, process.argv[2] || ".build/design-review");
const base = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8080";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch();
const report = {};
try {
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
  ]) {
    const page = await browser.newPage({ viewport: { width, height } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base);
    await page.screenshot({ path: path.join(out, name + "-early.png") });
    await page.getByRole("button", { name: "Sign in", exact: true }).waitFor();
    await page.screenshot({ path: path.join(out, name + "-login.png") });
    if (process.env.DEMO_PASSWORD) {
      await page
        .getByLabel("Username", { exact: false })
        .fill(process.env.DEMO_USERNAME || "admin_demo");
      await page
        .getByLabel("Password", { exact: false })
        .fill(process.env.DEMO_PASSWORD);
      await page.getByRole("button", { name: "Sign in", exact: true }).click();
      await page.locator(".app-shell").waitFor();
      await page.waitForLoadState("networkidle");
      if (process.argv[3]) await page.goto(base + process.argv[3]);
      await page.waitForLoadState("networkidle");
    }
    await page.screenshot({ path: path.join(out, name + ".png") });
    report[name] = await page.evaluate(() => ({
      title: document.title,
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
      fonts: document.fonts.status,
      h1: document.querySelector("h1")?.textContent,
    }));
    report[name].errors = errors;
    await page.close();
  }
} finally {
  await browser.close();
}
await fs.writeFile(path.join(out, "qa.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
