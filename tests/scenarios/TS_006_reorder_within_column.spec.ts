import { test, expect } from "@playwright/test";
import { register, login, createItem, getItems } from "../helpers/api";
import dotenv from "dotenv";
dotenv.config();

// TS_006: Reorder Items Within Column
// TS_006_TC_001: Drag to reorder within same column; API order matches UI order.

test.describe("TS_006 Reorder Items Within Column", () => {
  test("TS_006_TC_001 Reorder within Todo and verify API order", async ({
    page,
    request,
  }) => {
    const email = process.env.email || "";
    const password = process.env.password || "";
    const name = process.env.name || "";

    // Setup: login and create three Todo items
    const auth = await login(request, email, password);
    const token = auth.token as string;

    const a = await createItem(request, token, {
      title: "TS006 A",
      column: "todo",
    });
    const b = await createItem(request, token, {
      title: "TS006 B",
      column: "todo",
    });
    const c = await createItem(request, token, {
      title: "TS006 C",
      column: "todo",
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

    const col = page.getByTestId("column-todo");
    // Wait until all items render in UI
    await expect(page.getByTestId(`item-${a.id}`)).toBeVisible();
    await expect(page.getByTestId(`item-${b.id}`)).toBeVisible();
    await expect(page.getByTestId(`item-${c.id}`)).toBeVisible();
    const idsBefore = await col
      .locator("[data-testid^='item-']")
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-testid")!.replace("item-", ""))
      );

    // Sanity: ensure the three items are present
    expect(idsBefore).toEqual(expect.arrayContaining([a.id, b.id, c.id]));

    // Reorder in UI (downward-only supported): drop onto the column to append at end.
    // Move middle item to the bottom by dragging it onto the same column container.
    const middleId = idsBefore[1];
    await page
      .getByTestId(`item-${middleId}`)
      .dragTo(page.getByTestId("column-todo"));

    // Expected order: keep all except the moved one in place, then append the moved one at the end
    const expectedOrder = idsBefore
      .filter((id) => id !== middleId)
      .concat(middleId);

    // One combined poll: wait until UI and API both reflect the expected order
    await expect
      .poll(
        async () => {
          const idsUI = await col
            .locator("[data-testid^='item-']")
            .evaluateAll((els) =>
              els.map((el) =>
                el.getAttribute("data-testid")!.replace("item-", "")
              )
            );
          const list = await getItems(request, token);
          const apiTodoIds = list
            .filter((i: any) => i.column === "todo")
            .sort((x: any, y: any) => x.order - y.order)
            .map((i: any) => i.id);
          return JSON.stringify([idsUI, apiTodoIds]);
        },
        { timeout: 10000 }
      )
      .toBe(JSON.stringify([expectedOrder, expectedOrder]));
    // Optional: hit Refresh to visually confirm state remains consistent
    await page.getByTestId("refresh").click();
    await expect
      .poll(
        async () => {
          const idsUI = await col
            .locator("[data-testid^='item-']")
            .evaluateAll((els) =>
              els.map((el) =>
                el.getAttribute("data-testid")!.replace("item-", "")
              )
            );
          const list = await getItems(request, token);
          const apiTodoIds = list
            .filter((i: any) => i.column === "todo")
            .sort((x: any, y: any) => x.order - y.order)
            .map((i: any) => i.id);
          return JSON.stringify([idsUI, apiTodoIds]);
        },
        { timeout: 7000 }
      )
      .toBe(JSON.stringify([expectedOrder, expectedOrder]));
  });
});
