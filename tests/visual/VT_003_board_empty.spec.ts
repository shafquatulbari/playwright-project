import { test, expect } from "@playwright/test";
import { register, login } from "../helpers/api";
import { visualCompare, saveAllResults, clearResults } from "./utils/visual-test-helper";

function uniqueEmail(): string {
  return `vt003+${Date.now()}@test.io`;
}

test.describe("VT_003 Empty Board Visual Tests", () => {
  test.beforeAll(() => clearResults());
  test.afterAll(() => saveAllResults());

  test("VT_003_01 Empty board after login", async ({ page, request }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "VT003 User";

    // Register via API for speed
    await register(request, name, email, password);

    // Login via UI
    await page.goto("/");
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    await expect(page.getByText("Playwright Demo Board")).toBeVisible();
    await page.waitForTimeout(500);

    const result = await visualCompare(page, "board-empty-full");
    console.log(`Empty board: ${result.diffPercent}% diff, match=${result.match}`);
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });

  test("VT_003_02 Board header with user info", async ({ page, request }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "VT003 Header";

    await register(request, name, email, password);

    await page.goto("/");
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    await expect(page.getByText("Playwright Demo Board")).toBeVisible();
    await page.waitForTimeout(500);

    // Screenshot just the header area
    const header = page.locator(".header");
    const result = await visualCompare(page, "board-header");
    console.log(`Board header: ${result.diffPercent}% diff, match=${result.match}`);
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });
});
