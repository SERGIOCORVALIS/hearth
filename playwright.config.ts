import { defineConfig, devices } from "@playwright/test";

const reuse = !process.env.CI;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    ...devices["Desktop Chrome"],
    // Local: use installed Chrome if Playwright browser download is slow/blocked.
    ...(process.env.CI ? {} : { channel: "chrome" as const }),
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
  },
  webServer: {
    command: "node scripts/e2e-stack.mjs",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: reuse,
    timeout: 180_000,
  },
});
