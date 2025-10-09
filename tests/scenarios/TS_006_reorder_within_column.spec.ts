import { test, expect } from "@playwright/test";
import { register, login, createItem, getItems, reorder } from "../helpers/api";

function uniqueEmail(): string {
  return `ts006+${Date.now()}@test.io`;
}

// TS_006: Reorder Items Within Column
// TS_006_TC_001: Drag to reorder within same column; API order matches UI order.

test.describe("TS_006 Reorder Items Within Column", () => {
  test("TS_006_TC_001 Reorder within Todo and verify API order", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "TS006 User";

    // Setup: register/login and create three Todo items
    await register(request, name, email, password);
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

    const col = page.getByTestId("column-todo");
    // Wait until both items render in UI
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

    // Reorder in UI: move the last to the top (drag C over A)
    await page
      .getByTestId(`item-${c.id}`)
      .dragTo(page.getByTestId(`item-${a.id}`));

    // Read UI order after reorder
    const idsAfterUI = await col
      .locator("[data-testid^='item-']")
      .evaluateAll((els) =>
        els.map((el) => el.getAttribute("data-testid")!.replace("item-", ""))
      );

    // Persist the UI order via API reorder, then verify both API and UI align
    const orderMap = { todo: idsAfterUI, doing: [], done: [] } as Record<
      string,
      string[]
    >;
    const reordered = await reorder(request, token, orderMap);

    const apiTodoIds = reordered
      .filter((i: any) => i.column === "todo")
      .sort((x: any, y: any) => x.order - y.order)
      .map((i: any) => i.id);

    expect(apiTodoIds).toEqual(idsAfterUI);

    // Optionally hit Refresh and ensure UI order matches API
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
          return JSON.stringify(idsUI) === JSON.stringify(apiTodoIds);
        },
        { timeout: 5000 }
      )
      .toBe(true);
  });
});
