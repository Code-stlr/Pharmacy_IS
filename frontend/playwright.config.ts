import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  use: {
    baseURL: "http://localhost:8080",
    browserName: "chromium",
    headless: true,
  },
  reporter: "list",
});
