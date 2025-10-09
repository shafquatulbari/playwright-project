import { test, expect } from "@playwright/test";
import { login, getItems } from "../helpers/api";

function uniqueEmail(): string {
  return `e2e+${Date.now()}@test.io`;
}

test.describe("TS_001 Registration and Login", () => {
  test("TS_001_TC_001 Register new user via UI and land on Board", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "TS001 User";

    await page.goto("/");
    await page.getByTestId("switch-to-register").click();
    await page.getByTestId("register-name").fill(name);
    await page.getByTestId("register-email").fill(email);
    await page.getByTestId("register-password").fill(password);
    await page.getByTestId("register-submit").click();

    await expect(page.getByText("Playwright Demo Board")).toBeVisible();
    await expect(page.getByText(/Signed in as/i)).toBeVisible();

    // Obtain a fresh API token by logging in via API (avoid localStorage evaluate)
    const auth = await login(request, email, password);
    const token = auth.token as string;
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(10);

    // Fetch items from API and compare with UI per column (expect empty on a new account)
    const apiItems = await getItems(request, token);
    expect(Array.isArray(apiItems)).toBe(true);

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

    const uiTodoIds = await getUIIds("todo");
    const uiDoingIds = await getUIIds("doing");
    const uiDoneIds = await getUIIds("done");

    expect(uiTodoIds.length).toBe(apiByColIds.todo.length);
    expect(uiDoingIds.length).toBe(apiByColIds.doing.length);
    expect(uiDoneIds.length).toBe(apiByColIds.done.length);

    // Compare sets (order may differ); sort for deterministic equality
    expect(uiTodoIds.sort()).toEqual([...apiByColIds.todo].sort());
    expect(uiDoingIds.sort()).toEqual([...apiByColIds.doing].sort());
    expect(uiDoneIds.sort()).toEqual([...apiByColIds.done].sort());
  });

  test("TS_001_TC_002 Logout and Login again via UI", async ({
    page,
    request,
  }) => {
    await page.goto("/");
    const logoutButton = page.getByTestId("logout");
    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
    }

    await page.getByTestId("switch-to-login").click();

    const email = uniqueEmail();
    const password = "Password123!";
    const name = "TS001 User2";

    await page.getByTestId("switch-to-register").click();
    await page.getByTestId("register-name").fill(name);
    await page.getByTestId("register-email").fill(email);
    await page.getByTestId("register-password").fill(password);
    await page.getByTestId("register-submit").click();
    await expect(page.getByTestId("logout")).toBeVisible();

    await page.getByTestId("logout").click();
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    await expect(page.getByText("Playwright Demo Board")).toBeVisible();
    await expect(page.getByTestId("logout")).toBeVisible();

    // Robust API↔UI empty-board verification for the second account as well
    const auth = await login(request, email, password);
    const token = auth.token as string;
    const apiItems = await getItems(request, token);

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

    const uiTodoIds = await getUIIds("todo");
    const uiDoingIds = await getUIIds("doing");
    const uiDoneIds = await getUIIds("done");

    expect(uiTodoIds.length).toBe(apiByColIds.todo.length);
    expect(uiDoingIds.length).toBe(apiByColIds.doing.length);
    expect(uiDoneIds.length).toBe(apiByColIds.done.length);

    expect(uiTodoIds.sort()).toEqual([...apiByColIds.todo].sort());
    expect(uiDoingIds.sort()).toEqual([...apiByColIds.doing].sort());
    expect(uiDoneIds.sort()).toEqual([...apiByColIds.done].sort());
  });
});
