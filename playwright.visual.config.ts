import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // run visual tests sequentially for consistent screenshots
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "off",
    video: "off",
    headless: true,
    viewport: { width: 1280, height: 720 },
    // No slowMo for visual tests — we want clean, consistent screenshots
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 720 } } },
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport: { width: 1280, height: 720 } } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport: { width: 1280, height: 720 } } },
  ],
});
