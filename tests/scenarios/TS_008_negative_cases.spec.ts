import { test, expect } from "@playwright/test";
import { register, login, createItem } from "../helpers/api";

function uniqueEmail(): string {
  return `ts008+${Date.now()}@test.io`;
}

const API_BASE = "http://localhost:4000";

// TS_008: Negative Cases
// TS_008_TC_001: Invalid login shows UI error; API returns 401
// TS_008_TC_002: Empty title is prevented in UI; API returns 400
// TS_008_TC_003: Invalid token yields API 401; re-login restores UI access

test.describe("TS_008 Negative Cases", () => {
  test("TS_008_TC_001 Invalid login shows error and API 401", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Password123!";

    // Ensure account exists
    await register(request, "TS008 User1", email, password);

    // Try wrong password in UI
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill("WrongPassword!");
    await page.getByTestId("login-submit").click();

    // Expect UI error alert with API message
    const alert = page.getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/invalid credentials/i);

    // Direct API check returns 401
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email, password: "WrongPassword!" },
    });
    expect(res.status()).toBe(401);
  });

  test("TS_008_TC_002 Empty title prevented in UI; API returns 400", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Password123!";

    // Setup user
    await register(request, "TS008 User2", email, password);
    const auth = await login(request, email, password);
    const token = auth.token as string;

    // Login via UI
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    // Capture counts before
    const todoCol = page.getByTestId("column-todo");
    const beforeCount = await todoCol.locator("[data-testid^='item-']").count();

    // Try to add with empty title via UI (UI should block)
    await page.getByTestId("new-item-title").fill("");
    await page.getByTestId("add-item").click();

    const afterCount = await todoCol.locator("[data-testid^='item-']").count();
    expect(afterCount).toBe(beforeCount);

    // API: attempt to create empty title should return 400
    const res = await request.post(`${API_BASE}/api/items`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: "", column: "todo" },
    });
    expect(res.status()).toBe(400);
  });

  test("TS_008_TC_003 Invalid token causes 401; re-login restores", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Password123!";

    // Setup: user and a card to be visible
    await register(request, "TS008 User3", email, password);
    const auth = await login(request, email, password);
    const token = auth.token as string;
    const created = await createItem(request, token, {
      title: "TS008 Item",
      column: "todo",
    });

    // Login via UI
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    // Confirm visible
    await expect(page.getByTestId(`item-${created.id}`)).toBeVisible();

    // Tamper token in localStorage
    await page.evaluate(() =>
      localStorage.setItem("token", "invalid.token.value")
    );

    // Trigger fetch via Refresh (may surface error internally)
    await page.getByTestId("refresh").click();

    // API: confirm invalid token yields 401
    const res = await request.get(`${API_BASE}/api/items`, {
      headers: { Authorization: `Bearer invalid.token.value` },
    });
    expect(res.status()).toBe(401);

    // Now logout and login again to restore state
    await page.getByTestId("logout").click();
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    // Card should be visible again after valid token fetch
    await expect(page.getByTestId(`item-${created.id}`)).toBeVisible();
  });
});
