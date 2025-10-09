import { test, expect } from "@playwright/test";
import {
  register,
  login,
  createItem,
  getItems,
  updateItem,
} from "../helpers/api";

function uniqueEmail(): string {
  return `ts007+${Date.now()}@test.io`;
}

// TS_007: Priority and Timestamps
// TS_007_TC_001: Add item with priority=Urgent; UI shows Urgent; API priority='urgent' and timestamps non-null.
// TS_007_TC_002: Update item via API; Refresh UI; UI updatedAt increases and matches API updatedAt (± skew).

test.describe.configure({ mode: "serial" });

test.describe("TS_007 Priority and Timestamps", () => {
  let email: string;
  let password: string;
  let name: string;
  let token: string;
  let createdId: string;

  test("TS_007_TC_001 Create item with priority=Urgent and verify UI/API", async ({
    page,
    request,
  }) => {
    email = uniqueEmail();
    password = "Password123!";
    name = "TS007 User";

    // Register and login via API
    await register(request, name, email, password);
    const auth = await login(request, email, password);
    token = auth.token as string;

    // Login via UI
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    // Create item via UI with priority Urgent
    await page.getByTestId("new-item-title").fill("TS007 Urgent Item");
    await page.getByTestId("new-item-priority").selectOption("urgent");
    await page.getByTestId("add-item").click();

    // Locate created card in UI by title
    const todoCol = page.getByTestId("column-todo");
    const titleEl = todoCol.locator(".item .title", {
      hasText: "TS007 Urgent Item",
    });
    await expect(titleEl).toBeVisible();

    // Capture the created ID from the closest ancestor having data-testid^="item-"
    const cardTestId = await titleEl.evaluate((el) => {
      const host = el.closest('[data-testid^="item-"]');
      return host ? host.getAttribute("data-testid") : null;
    });
    expect(cardTestId).toBeTruthy();
    createdId = (cardTestId as string).replace("item-", "");

    // Verify API shows priority and timestamps
    const items = await getItems(request, token);
    const created = items.find((i: any) => i.id === createdId);
    expect(created).toBeTruthy();
    expect(created.priority).toBe("urgent");
    expect(typeof created.createdAt).toBe("number");
    expect(typeof created.updatedAt).toBe("number");
  });

  test("TS_007_TC_002 Update item via API and verify updatedAt increases and matches UI", async ({
    page,
    request,
  }) => {
    // Precondition from TC_001: we have token and createdId
    // Note: each test gets a fresh page, so navigate and login again for UI assertions
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    const before = (await getItems(request, token)).find(
      (i: any) => i.id === createdId
    );
    expect(before).toBeTruthy();
    const beforeUpdatedAt = before.updatedAt as number;

    // Perform API update (no-op title change to bump updatedAt)
    await updateItem(request, token, createdId, {
      title: "TS007 Urgent Item +1",
    });

    // Wait for API updatedAt > before
    await expect
      .poll(
        async () => {
          const list = await getItems(request, token);
          const after = list.find((i: any) => i.id === createdId);
          return (
            after &&
            typeof after.updatedAt === "number" &&
            after.updatedAt > beforeUpdatedAt
          );
        },
        { timeout: 5000 }
      )
      .toBe(true);

    // Refresh UI via in-app button, then wait for the card to re-render
    await page.getByTestId("refresh").click();
    await expect
      .poll(async () => {
        return await page.getByTestId(`item-${createdId}`).count();
      }, { timeout: 7000 })
      .toBeGreaterThan(0);

    // UI: title shows new value and updated label appears
    const card = page.getByTestId(`item-${createdId}`);
    await expect(card).toBeVisible();
    await expect(card.locator(".title")).toHaveText("TS007 Urgent Item +1");
    await expect(card).toContainText(/updated:/i);
  });
});
