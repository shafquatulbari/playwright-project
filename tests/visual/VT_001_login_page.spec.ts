import { test, expect } from "@playwright/test";
import { visualCompare, saveAllResults, clearResults } from "./utils/visual-test-helper";

test.describe("VT_001 Login Page Visual Tests", () => {
  test.beforeAll(() => clearResults());
  test.afterAll(() => saveAllResults());

  test("VT_001_01 Login page default state", async ({ page }) => {
    await page.goto("/");
    // Ensure login form is visible
    await expect(page.getByTestId("login-submit")).toBeVisible();
    await page.waitForTimeout(500); // let animations settle

    const result = await visualCompare(page, "login-page-default");
    console.log(`Login default: ${result.diffPercent}% diff, match=${result.match}`);
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });

  test("VT_001_02 Login page with filled form", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("login-submit")).toBeVisible();

    await page.getByTestId("login-email").fill("test@example.com");
    await page.getByTestId("login-password").fill("Password123!");
    await page.waitForTimeout(300);

    const result = await visualCompare(page, "login-page-filled");
    console.log(`Login filled: ${result.diffPercent}% diff, match=${result.match}`);
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });

  test("VT_001_03 Login page error state", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("login-submit")).toBeVisible();

    await page.getByTestId("login-email").fill("wrong@example.com");
    await page.getByTestId("login-password").fill("wrongpassword");
    await page.getByTestId("login-submit").click();

    // Wait for error to appear
    await page.waitForTimeout(2000);

    const result = await visualCompare(page, "login-page-error");
    console.log(`Login error: ${result.diffPercent}% diff, match=${result.match}`);
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });
});
