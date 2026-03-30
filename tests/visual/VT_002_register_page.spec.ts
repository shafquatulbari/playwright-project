import { test, expect } from "@playwright/test";
import { visualCompare, saveAllResults, clearResults } from "./utils/visual-test-helper";

test.describe("VT_002 Register Page Visual Tests", () => {
  test.beforeAll(() => clearResults());
  test.afterAll(() => saveAllResults());

  test("VT_002_01 Register page default state", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("switch-to-register").click();
    await expect(page.getByTestId("register-submit")).toBeVisible();
    await page.waitForTimeout(500);

    const result = await visualCompare(page, "register-page-default");
    console.log(`Register default: ${result.diffPercent}% diff, match=${result.match}`);
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });

  test("VT_002_02 Register page with filled form", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("switch-to-register").click();
    await expect(page.getByTestId("register-submit")).toBeVisible();

    await page.getByTestId("register-name").fill("Test User");
    await page.getByTestId("register-email").fill("testuser@example.com");
    await page.getByTestId("register-password").fill("Password123!");
    await page.waitForTimeout(300);

    const result = await visualCompare(page, "register-page-filled");
    console.log(`Register filled: ${result.diffPercent}% diff, match=${result.match}`);
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });
});
