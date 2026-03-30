import { test, expect } from "@playwright/test";
import { register, login, createItem } from "../helpers/api";
import { visualCompare, saveAllResults, clearResults } from "./utils/visual-test-helper";

function uniqueEmail(): string {
  return `vt004+${Date.now()}@test.io`;
}

test.describe("VT_004 Board With Items Visual Tests", () => {
  test.beforeAll(() => clearResults());
  test.afterAll(() => saveAllResults());

  test("VT_004_01 Board with items in Todo column", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "VT004 User";

    await register(request, name, email, password);
    const auth = await login(request, email, password);
    const token = auth.token;

    // Create items via API
    await createItem(request, token, {
      title: "Design homepage",
      priority: "high",
    });
    await createItem(request, token, {
      title: "Write unit tests",
      priority: "normal",
    });
    await createItem(request, token, {
      title: "Fix critical bug",
      priority: "urgent",
    });

    // Login via UI
    await page.goto("/");
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    await expect(page.getByText("Playwright Demo Board")).toBeVisible();
    await expect(page.getByText("Design homepage")).toBeVisible();
    await page.waitForTimeout(500);

    const result = await visualCompare(page, "board-with-todo-items");
    console.log(
      `Board with todos: ${result.diffPercent}% diff, match=${result.match}`
    );
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });

  test("VT_004_02 Board with items across all columns", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "VT004 Multi";

    await register(request, name, email, password);
    const auth = await login(request, email, password);
    const token = auth.token;

    // Create items in different columns
    await createItem(request, token, {
      title: "Todo task",
      column: "todo",
      priority: "low",
    });
    await createItem(request, token, {
      title: "In progress task",
      column: "doing",
      priority: "high",
    });
    await createItem(request, token, {
      title: "Completed task",
      column: "done",
      priority: "normal",
    });
    await createItem(request, token, {
      title: "Another todo",
      column: "todo",
      priority: "urgent",
    });

    await page.goto("/");
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    await expect(page.getByText("Playwright Demo Board")).toBeVisible();
    await expect(page.getByText("Todo task")).toBeVisible();
    await page.waitForTimeout(500);

    const result = await visualCompare(page, "board-all-columns");
    console.log(
      `Board all columns: ${result.diffPercent}% diff, match=${result.match}`
    );
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });

  test("VT_004_03 Task cards with different priorities", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "VT004 Priority";

    await register(request, name, email, password);
    const auth = await login(request, email, password);
    const token = auth.token;

    await createItem(request, token, {
      title: "Low priority",
      priority: "low",
    });
    await createItem(request, token, {
      title: "Normal priority",
      priority: "normal",
    });
    await createItem(request, token, {
      title: "High priority",
      priority: "high",
    });
    await createItem(request, token, {
      title: "Urgent priority",
      priority: "urgent",
    });

    await page.goto("/");
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    await expect(page.getByText("Low priority")).toBeVisible();
    await page.waitForTimeout(500);

    const result = await visualCompare(page, "task-cards-priorities");
    console.log(
      `Task cards: ${result.diffPercent}% diff, match=${result.match}`
    );
    if (result.aiAnalysis) {
      console.log(`AI Summary: ${result.aiAnalysis.summary}`);
    }
  });
});
