import { test, expect } from "@playwright/test";
import { register, login, getItems } from "../helpers/api";

function uniqueEmail(): string {
  return `ts002+${Date.now()}@test.io`;
}

// TS_002: Create Item and Verify in API
// - TS_002_TC_001: Create via UI; verify card in Todo with priority and timestamps
// - TS_002_TC_002: Verify API shows item under todo and API↔UI counts/titles match

test.describe.configure({ mode: "serial" });

let savedEmail: string;
let savedPassword: string;
let savedName: string;

test.describe("TS_002 Create Item and Verify in API", () => {
  test("TS_002_TC_001 Create item via UI and see it in Todo with details", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "TS002 User";

    // save creds for the next test case in this scenario
    savedEmail = email;
    savedPassword = password;
    savedName = name;

    // Register via API to get token and enable API checks later
    const reg = await register(request, name, email, password);
    const token = reg.token as string;

    // Login via UI
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    // Create item via UI with priority Normal
    await page.getByTestId("new-item-title").fill("First Task");
    await page.getByTestId("new-item-priority").selectOption("normal");
    await page.getByTestId("add-item").click();

    // Validate via UI: card appears under Todo with the given title
    const todoCol = page.getByTestId("column-todo");
    await expect(
      todoCol.locator(".item .title", { hasText: "First Task" })
    ).toHaveCount(1);

    // Validate via API: the item exists under todo and has a priority set
    await expect
      .poll(
        async () => {
          const items = await getItems(request, token);
          return items.some(
            (i: any) =>
              i.title === "First Task" && i.column === "todo" && i.priority
          );
        },
        { timeout: 5000 }
      )
      .toBe(true);

    // Timestamps are asserted in TC_002 using the API
  });

  test("TS_002_TC_002 Verify API shows item under todo and matches UI", async ({
    page,
    request,
  }) => {
    // Log back into the UI with the same user to render the board
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(savedEmail);
    await page.getByTestId("login-password").fill(savedPassword);
    await page.getByTestId("login-submit").click();

    // Get a fresh API token via the API (don't rely on localStorage across tests)
    const auth = await login(request, savedEmail, savedPassword);
    const token = auth.token as string;

    // Pull items from API and compare by column using IDs (more robust than titles)
    const apiItems = await getItems(request, token);
    const apiByColIds = {
      todo: apiItems
        .filter((i: any) => i.column === "todo")
        .map((i: any) => i.id),
      doing: apiItems
        .filter((i: any) => i.column === "doing")
        .map((i: any) => i.id),
      done: apiItems
        .filter((i: any) => i.column === "done")
        .map((i: any) => i.id),
    } as const;

    const getUIIds = async (col: "todo" | "doing" | "done") => {
      const ids = await page
        .getByTestId(`column-${col}`)
        .locator("[data-testid^='item-']")
        .evaluateAll((els) =>
          els
            .map((el) => el.getAttribute("data-testid") || "")
            .map((v) => v.replace("item-", ""))
            .filter(Boolean)
        );
      return ids as string[];
    };

    const uiTodoIds = await getUIIds("todo");
    const uiDoingIds = await getUIIds("doing");
    const uiDoneIds = await getUIIds("done");

    expect(uiTodoIds.sort()).toEqual([...apiByColIds.todo].sort());
    expect(uiDoingIds.sort()).toEqual([...apiByColIds.doing].sort());
    expect(uiDoneIds.sort()).toEqual([...apiByColIds.done].sort());

    // Verify the created item has non-null timestamps and priority in API
    const apiTodo = apiItems.filter((i: any) => i.column === "todo");
    const created = apiTodo.find((i: any) => typeof i.title === "string");
    expect(created).toBeTruthy();
    expect(created.priority).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();
  });
});
