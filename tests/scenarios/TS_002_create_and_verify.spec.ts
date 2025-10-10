import { test, expect } from "@playwright/test";
import { register, login, getItems } from "../helpers/api";
import dotenv from "dotenv";
dotenv.config();

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
    const email = process.env.email || "";
    const password = process.env.password || "";
    const name = process.env.name || "";

    // save creds for the next test case in this scenario
    savedEmail = email;
    savedPassword = password;
    savedName = name;
    // Get a fresh API token via the API (don't rely on localStorage across tests)
    const auth = await login(request, savedEmail, savedPassword);
    const token = auth.token as string;

    // Login via UI
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();
    await expect(page.getByText("Playwright Demo Board")).toBeVisible();
    await expect(page.getByText(`Signed in as ${savedName}`)).toBeVisible();
    // Create item via UI with priority Normal, give a random title
    const taskName = `Task ${Date.now()}`;
    await page.getByTestId("new-item-title").fill(taskName);
    await page.getByTestId("new-item-priority").selectOption("normal");
    await page.getByTestId("add-item").click();

    // Validate via UI: card appears under Todo with the given title
    const todoCol = page.getByTestId("column-todo");
    await expect(
      todoCol.locator(".item .title", { hasText: taskName })
    ).toHaveCount(1);

    // Validate via API: the item exists under todo and has a priority set
    await expect
      .poll(
        async () => {
          const items = await getItems(request, token); // fetch items from API
          return items.some(
            (i: any) =>
              i.title === taskName &&
              i.column === "todo" &&
              i.priority === "normal"
          );
        },
        { timeout: 5000 }
      )
      .toBe(true); // returns true if found within timeout
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

    await expect(page.getByText("Playwright Demo Board")).toBeVisible();
    await expect(page.getByText(`Signed in as ${savedName}`)).toBeVisible();

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
        .evaluateAll(
          (els) =>
            els
              .map((el) => el.getAttribute("data-testid") || "") // get attribute or empty string
              .map((v) => v.replace("item-", "")) // remove prefix
              .filter(Boolean) // remove empty strings
        );
      return ids as string[];
    };

    console.log(
      "API IDs by column:",
      `{
      todo: ${JSON.stringify(apiByColIds.todo)},
      doing: ${JSON.stringify(apiByColIds.doing)},
      done: ${JSON.stringify(apiByColIds.done)}
    }`
    );
    console.log(
      "UI IDs by column:",
      `{
      todo: ${JSON.stringify(await getUIIds("todo"))},
      doing: ${JSON.stringify(await getUIIds("doing"))},
      done: ${JSON.stringify(await getUIIds("done"))}
    }`
    );

    // Wait until UI reflects API items after login (avoid race with initial fetch)
    await expect
      .poll(
        // keep polling until the condition is true or timeout
        async () => {
          // polling function
          const uiTodoIds = await getUIIds("todo"); // get IDs from UI
          const uiDoingIds = await getUIIds("doing"); // get IDs from UI
          const uiDoneIds = await getUIIds("done"); // get IDs from UI
          return (
            JSON.stringify(uiTodoIds.sort()) === // compare sorted JSON strings
              JSON.stringify([...apiByColIds.todo].sort()) &&
            JSON.stringify(uiDoingIds.sort()) === // compare sorted JSON strings
              JSON.stringify([...apiByColIds.doing].sort()) &&
            JSON.stringify(uiDoneIds.sort()) === // compare sorted JSON strings
              JSON.stringify([...apiByColIds.done].sort())
          );
        },
        { timeout: 7000 } // overall timeout for polling
      )
      .toBe(true); // expect the polling result to be true

    // At least one item should be present under Todo (created in the previous test)
    expect(apiByColIds.todo.length).toBeGreaterThan(0);

    // Verify the created item has non-null timestamps and priority in API
    const apiTodo = apiItems.filter((i: any) => i.column === "todo");
    const created = apiTodo.find((i: any) => typeof i.title === "string");
    expect(created).toBeTruthy();
    expect(created.priority).toBeTruthy();
    expect(created.createdAt).toBeTruthy();
    expect(created.updatedAt).toBeTruthy();
  });
});
