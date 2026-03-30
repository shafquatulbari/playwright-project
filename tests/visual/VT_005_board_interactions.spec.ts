import { test, expect } from "@playwright/test";
import { register, login, createItem } from "../helpers/api";
import { visualCompare, saveAllResults, clearResults } from "./utils/visual-test-helper";

function uniqueEmail(): string {
  return `vt005+${Date.now()}@test.io`;
}

test.describe("VT_005 Board Interactions Visual Tests", () => {
  test.beforeAll(() => clearResults());
  test.afterAll(() => saveAllResults());

  test("VT_005_01 Add task form area", async ({ page, request }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "VT005 Form";

    await register(request, name, email, password);

    await page.goto("/");
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    await expect(page.getByText("Playwright Demo Board")).toBeVisible();

    // Fill in the add task form
    await page.getByTestId("new-item-title").fill("New visual test task");
    await page.waitForTimeout(300);

    const result = await visualCompare(page, "add-task-form");
    console.log(
      `Add task form: ${result.diffPercent}% diff, match=${result.match}`
    );
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });

  test("VT_005_02 Priority dropdown selection", async ({ page, request }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "VT005 Dropdown";

    await register(request, name, email, password);

    await page.goto("/");
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    await expect(page.getByText("Playwright Demo Board")).toBeVisible();

    // Select urgent priority
    await page.getByTestId("new-item-priority").selectOption("urgent");
    await page.waitForTimeout(300);

    const result = await visualCompare(page, "priority-dropdown-urgent");
    console.log(
      `Priority dropdown: ${result.diffPercent}% diff, match=${result.match}`
    );
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });

  test("VT_005_03 Board with drag target highlights", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "VT005 Drag";

    await register(request, name, email, password);
    const auth = await login(request, email, password);
    const token = auth.token;

    await createItem(request, token, {
      title: "Drag me",
      priority: "high",
    });

    await page.goto("/");
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    await expect(page.getByText("Drag me")).toBeVisible();
    await page.waitForTimeout(500);

    const result = await visualCompare(page, "board-with-draggable");
    console.log(
      `Draggable board: ${result.diffPercent}% diff, match=${result.match}`
    );
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });
});
