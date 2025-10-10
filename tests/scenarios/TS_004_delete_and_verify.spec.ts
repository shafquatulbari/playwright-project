import { test, expect } from "@playwright/test";
import { register, login, createItem, getItems } from "../helpers/api";
import dotenv from "dotenv";
dotenv.config();

// TS_004: Delete Item and Verify in API
// TS_004_TC_001: 1) Click Delete on the card
// Expected: API no longer returns the item; UI count decrements; item removed from column.

test.describe("TS_004 Delete Item and Verify in API", () => {
  test("TS_004_TC_001 Delete item via UI and verify API no longer returns it", async ({
    page,
    request,
  }) => {
    const email = process.env.email || "";
    const password = process.env.password || "";
    const name = process.env.name || "";

    // Setup: login and create an item via API
    const auth = await login(request, email, password);
    const token = auth.token as string;

    const created = await createItem(request, token, {
      title: "TS004 Item",
      column: "todo",
      priority: "normal",
    });

    // Login via UI
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    // Verify successful login
    await expect(page.getByText("Playwright Demo Board")).toBeVisible();
    await expect(page.getByText(`Signed in as ${name}`)).toBeVisible();

    // Verify card present; capture pre-delete UI count in Todo
    const todoCol = page.getByTestId("column-todo");
    const itemCard = page.getByTestId(`item-${created.id}`);
    await expect(itemCard).toBeVisible();

    const countBefore = await todoCol.locator("[data-testid^='item-']").count();

    // Perform delete via UI
    await page.getByTestId(`delete-${created.id}`).click();

    // UI: item should disappear and count should decrement
    await expect(itemCard).toHaveCount(0);

    const countAfter = await todoCol.locator("[data-testid^='item-']").count();
    expect(countAfter).toBe(countBefore - 1);

    // API: item should no longer be present
    await expect
      .poll(
        async () => {
          const list = await getItems(request, token);
          return list.some((i: any) => i.id === created.id);
        },
        { timeout: 5000 }
      )
      .toBe(false);
  });
});
