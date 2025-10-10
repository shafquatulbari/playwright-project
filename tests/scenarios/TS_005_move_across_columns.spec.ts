import { test, expect } from "@playwright/test";
import { register, login, createItem, getItems } from "../helpers/api";
import dotenv from "dotenv";
dotenv.config();

// TS_005: Move Item Across Columns
// TS_005_TC_001: Drag Todo→Doing; verify UI shows in Doing; API shows column='doing'; counts adjust.

test.describe("TS_005 Move Item Across Columns", () => {
  test("TS_005_TC_001 Drag from Todo to Doing and verify API/UI", async ({
    page,
    request,
  }) => {
    const email = process.env.email || "";
    const password = process.env.password || "";
    const name = process.env.name || "";

    // Setup: login and create two Todo items to make counts meaningful
    const auth = await login(request, email, password);
    const token = auth.token as string;

    const itemA = await createItem(request, token, {
      title: "TS005 A",
      column: "todo",
    });
    const itemB = await createItem(request, token, {
      title: "TS005 B",
      column: "todo",
    });

    // Login via UI and verify both cards present in Todo
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    // Verify successful login
    await expect(page.getByText("Playwright Demo Board")).toBeVisible();
    await expect(page.getByText(`Signed in as ${name}`)).toBeVisible();

    // Verify both cards present in Todo
    const todoCol = page.getByTestId("column-todo");
    await expect(page.getByTestId(`item-${itemA.id}`)).toBeVisible();
    await expect(page.getByTestId(`item-${itemB.id}`)).toBeVisible();

    const todoCountBefore = await todoCol
      .locator("[data-testid^='item-']")
      .count();

    // Drag itemA to Doing
    await page
      .getByTestId(`item-${itemA.id}`)
      .dragTo(page.getByTestId("column-doing"));

    // UI verification: appears under Doing, disappears from Todo, counts adjust
    const doingCol = page.getByTestId("column-doing");
    await expect(doingCol).toContainText("TS005 A");
    await expect(page.getByTestId(`item-${itemA.id}`)).toBeVisible();
    const todoCountAfter = await todoCol
      .locator("[data-testid^='item-']")
      .count();
    expect(todoCountAfter).toBe(todoCountBefore - 1);

    // API verification: column=doing
    await expect
      .poll(
        async () => {
          const list = await getItems(request, token);
          const moved = list.find((i: any) => i.id === itemA.id);
          return moved?.column;
        },
        { timeout: 5000 }
      )
      .toBe("doing");
  });
});
