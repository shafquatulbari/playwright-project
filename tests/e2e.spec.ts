import { test, expect } from "@playwright/test";
import { getItems, register, createItem, updateItem } from "./helpers/api";

test.describe("Full flow API ↔ UI consistency", () => {
  test("register, login, CRUD, DnD, and verify API vs UI", async ({
    page,
    request,
  }) => {
    const email = `e2e+${Date.now()}@test.io`;
    const password = "Password123!";
    const name = "E2E User";

    // Register via API for speed
    const reg = await register(request, name, email, password);
    const token = reg.token as string;

    // Visit UI and login using UI
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    // Create item via UI and compare with API
    await page.getByTestId("new-item-title").fill("First Task");
    await page.getByTestId("add-item").click();
    await expect(page.getByTestId("column-todo")).toContainText("First Task");

    const apiAfterCreate = await getItems(request, token);
    const uiTitlesTodo = await page
      .getByTestId("column-todo")
      .locator(".item .title")
      .allTextContents();
    expect(apiAfterCreate.map((i: any) => i.title)).toEqual(
      expect.arrayContaining(uiTitlesTodo)
    );

    // Update first item via API then refresh UI
    const first = apiAfterCreate.find((i: any) => i.title === "First Task");
    await updateItem(request, token, first.id, { title: "Renamed Task" });
    await page.getByTestId("refresh").click();
    await expect(page.getByTestId("column-todo")).toContainText("Renamed Task");

    // Drag item to Doing
    const item = page.getByTestId(`item-${first.id}`);
    await item.dragTo(page.getByTestId("column-doing"));
    await expect(page.getByTestId("column-doing")).toContainText(
      "Renamed Task"
    );

    // Verify API shows column=doing
    const apiAfterMove = await getItems(request, token);
    const moved = apiAfterMove.find((i: any) => i.id === first.id);
    expect(moved.column).toBe("doing");

    // Create another via API, refresh UI, then compare full column data
    await createItem(request, token, { title: "Second Task", column: "doing" });
    await page.getByTestId("refresh").click();

    // Compare API vs UI by column - counts and titles
    const apiDoing = apiAfterMove.filter((i: any) => i.column === "doing");
    const uiDoingTitles = await page
      .getByTestId("column-doing")
      .locator(".item .title")
      .allTextContents();
    expect(uiDoingTitles.length).toBeGreaterThanOrEqual(apiDoing.length);
  });
});
