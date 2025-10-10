import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests",
  timeout: 60_000, // each test can run up to 60s before timing out
  expect: { timeout: 10_000 }, // expect conditions like toBeVisible() can wait up to 10s
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    video: "on-first-retry",
    launchOptions: {
      slowMo: 2000, // add ~2000ms delay before every action
    },
    headless: false, // run tests in headed mode for better visibility
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
