import { test, expect } from "@playwright/test";
import { register, login, createItem } from "../helpers/api";
import dotenv from "dotenv";
dotenv.config();

const API_BASE = "http://localhost:4000";

// TS_008: Negative Cases
// TS_008_TC_001: Invalid login shows UI error; API returns 401
// TS_008_TC_002: Empty title is prevented in UI; API returns 400

test.describe("TS_008 Negative Cases", () => {
  test("TS_008_TC_001 Invalid login shows error and API 401", async ({
    page,
    request,
  }) => {
    const email = process.env.email || "";
    const password = process.env.password || "";

    // Ensure account exists
    await login(request, email, password);

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
    const email = process.env.email || "";
    const password = process.env.password || "";
    const name = process.env.name || "";

    // login via API
    const auth = await login(request, email, password);
    const token = auth.token as string;

    // Login via UI
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    // Verify successful login
    await expect(page.getByText("Playwright Demo Board")).toBeVisible();
    await expect(page.getByText(`Signed in as ${name}`)).toBeVisible();

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
});
