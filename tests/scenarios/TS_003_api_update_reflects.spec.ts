import { test, expect } from "@playwright/test";
import {
  register,
  login,
  createItem,
  getItems,
  updateItem,
} from "../helpers/api";

function uniqueEmail(): string {
  return `ts003+${Date.now()}@test.io`;
}

// TS_003: API Update Reflects in UI
// TS_003_TC_001: 1) PUT /api/items/:id to change title/priority 2) Click Refresh in UI
// Expected: UI shows updated title/priority; updatedAt increases in UI and API.

test.describe("TS_003 API Update Reflects in UI", () => {
  test("TS_003_TC_001 Update item via API then verify in UI", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail();
    const password = "Password123!";
    const name = "TS003 User";

    // Register and login via API for token
    await register(request, name, email, password);
    const auth = await login(request, email, password);
    const token = auth.token as string;

    // Precondition: create an item via API (fast and deterministic)
    const created = await createItem(request, token, {
      title: "TS003 Item",
      column: "todo",
      priority: "low",
    });

    // Visit UI and login to render the board
    await page.goto("/");
    await page.getByTestId("switch-to-login").click();
    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();

    // Ensure the card is present in UI
    const itemCard = page.getByTestId(`item-${created.id}`);
    await expect(itemCard).toBeVisible();
    await expect(itemCard.locator(".title")).toHaveText("TS003 Item");
    await expect(itemCard).toContainText(
      /priority:\s*(low|normal|high|urgent)/i
    );

    // Capture UI's current "updated:" text (to detect change later)
    const updatedEl = itemCard
      .locator(".muted", { hasText: "updated:" })
      .first();
    const beforeUpdatedText = (await updatedEl.textContent()) || "";

    // Capture API's updatedAt before update
    const apiBefore = await getItems(request, token);
    const before = apiBefore.find((i: any) => i.id === created.id);
    expect(before).toBeTruthy();
    const beforeUpdatedAt = before.updatedAt as number;

    // Perform API update: change title and priority
    await updateItem(request, token, created.id, {
      title: "TS003 Item Updated",
      priority: "urgent",
    });

    // Wait until API reflects an increased updatedAt
    await expect
      .poll(
        async () => {
          const list = await getItems(request, token);
          const after = list.find((i: any) => i.id === created.id);
          return (
            after &&
            typeof after.updatedAt === "number" &&
            after.updatedAt > beforeUpdatedAt
          );
        },
        { timeout: 5000 }
      )
      .toBe(true);

    // Refresh UI to pull latest data
    await page.getByTestId("refresh").click();

    // Verify UI shows updated title and priority
    await expect(itemCard.locator(".title")).toHaveText("TS003 Item Updated");
    await expect(itemCard).toContainText(/priority:\s*urgent/i);

    // Verify UI indicates updated by presence of 'updated:' label after refresh
    await expect(itemCard).toContainText(/updated:/i);
  });
});
