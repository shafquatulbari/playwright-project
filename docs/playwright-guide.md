# Playwright Configuration and Test Patterns Guide

This guide explains how Playwright is configured in this project, the testing patterns used, and how to extend the test suite.

## Configuration Breakdown (playwright.config.ts)

### Test Discovery

```ts
testDir: "tests"
```

Playwright recursively scans the `tests/` directory for files matching `*.spec.ts`. All test scenarios live in `tests/scenarios/`.

### Timeouts

```ts
timeout: 60_000           // 60 seconds per test
expect: { timeout: 10_000 } // 10 seconds per assertion
```

- **Test timeout (60s)**: The maximum time an entire test (including all steps) can take before Playwright kills it. This is intentionally generous because `slowMo` adds 2 seconds per action.
- **Expect timeout (10s)**: How long assertion methods like `toBeVisible()`, `toHaveCount()`, and `toContainText()` will keep retrying before failing. Playwright auto-retries assertions until this timeout, which handles async UI updates gracefully.

### Parallelism

```ts
fullyParallel: true
```

When `true`, tests across different files run simultaneously in separate browser contexts. Each test gets its own isolated browser page. This speeds up the suite significantly but means tests must be independent — they cannot share state or rely on execution order.

**Exception**: Some test files use `test.describe.configure({ mode: "serial" })` to force sequential execution within that file (e.g., TS_002, TS_007 where TC_002 depends on TC_001's data).

### Browser Settings

```ts
use: {
  baseURL: "http://localhost:5173",
  headless: false,
  launchOptions: { slowMo: 2000 },
  trace: "on-first-retry",
  video: "on-first-retry",
}
```

| Setting | Value | Explanation |
| --- | --- | --- |
| `baseURL` | `http://localhost:5173` | Allows tests to use relative URLs like `page.goto("/")` instead of full URLs. Resolves to `http://localhost:5173/`. |
| `headless` | `false` | Opens visible browser windows so you can watch tests execute. Set to `true` for CI/pipelines. The `test:e2e` script overrides this to headless. |
| `slowMo` | `2000` | Adds a 2-second delay before every browser action (click, fill, navigation). Makes test execution observable by humans. Remove or reduce for faster runs. |
| `trace` | `"on-first-retry"` | Records a [Playwright Trace](https://playwright.dev/docs/trace-viewer) on the first retry of a failed test. Traces capture screenshots, DOM snapshots, network logs, and console output at each step. View with `npx playwright show-trace <file>`. |
| `video` | `"on-first-retry"` | Records a video of the browser on the first retry of a failed test. Saved alongside test results. |

### Browser Projects

```ts
projects: [
  { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  { name: "webkit", use: { ...devices["Desktop Safari"] } },
]
```

Tests run in **two browser engines**:
- **Chromium** — Chrome/Edge engine
- **WebKit** — Safari engine

Each project inherits device-specific settings (viewport size, user agent) from Playwright's built-in device descriptors. You can add Firefox by adding `{ name: "firefox", use: { ...devices["Desktop Firefox"] } }`.

Run a single project with: `npx playwright test --project=chromium`

### Reporters

```ts
reporter: [["list"], ["html", { open: "never" }]]
```

- **list** — prints test results line by line to the terminal during execution
- **html** — generates an HTML report in `playwright-report/` after the run. The `open: "never"` setting prevents auto-opening the report in a browser. View it manually with `npx playwright show-report`.

---

## Test Patterns Used

### 1. API vs UI Consistency Testing

The core pattern in this project. After any action (create, update, delete, move), tests verify both:
- **UI state** — what the browser renders (using Playwright's page locators)
- **API state** — what the backend returns (using Playwright's `request` context)

```ts
// Example: After creating an item via UI, verify via API
const apiItems = await getItems(request, token);
const todoItems = apiItems.filter(i => i.column === "todo");
expect(todoItems).toHaveLength(1);
expect(todoItems[0].title).toBe("First Task");
```

This catches bugs where the UI shows stale data or the API silently fails.

### 2. Dual Request Contexts

Every test receives two fixtures from Playwright:
- **`page`** — a browser page for UI interactions (click, fill, navigate)
- **`request`** — an HTTP client for direct API calls (no browser needed)

```ts
test("example", async ({ page, request }) => {
  // UI action
  await page.getByTestId("add-item").click();

  // API verification
  const items = await getItems(request, token);
});
```

### 3. data-testid Selectors

All UI elements that tests interact with have `data-testid` attributes. This decouples tests from CSS classes and DOM structure:

```ts
// Reliable — won't break if CSS classes change
await page.getByTestId("login-email").fill("user@test.com");

// Fragile — breaks if class name changes
await page.locator(".email-input").fill("user@test.com");
```

Convention: `data-testid` values follow the pattern `{component}-{element}` or `{action}-{id}`.

### 4. expect.poll() for Async Verification

When a UI action triggers an async API call, `expect.poll()` repeatedly calls a function until the assertion passes or times out:

```ts
await expect.poll(async () => {
  const items = await getItems(request, token);
  return items.filter(i => i.column === "doing").length;
}, { timeout: 10_000 }).toBe(1);
```

This is essential for drag-and-drop tests where the reorder API call happens asynchronously after the drop event.

### 5. evaluateAll() for Bulk DOM Extraction

When tests need to read multiple elements at once (e.g., all item IDs in a column), `evaluateAll()` runs JavaScript in the browser:

```ts
const ids = await page
  .getByTestId("column-todo")
  .locator("[data-testid^='item-']")
  .evaluateAll(els =>
    els.map(el => el.getAttribute("data-testid")?.replace("item-", ""))
       .filter(Boolean)
  );
```

This is faster than looping through locators individually and avoids race conditions.

### 6. Serial Test Mode

Some test files use `test.describe.configure({ mode: "serial" })` when tests within a describe block depend on each other:

```ts
test.describe("TS_002", () => {
  test.describe.configure({ mode: "serial" });

  test("TC_001 Create item", async ({ page }) => { /* creates item */ });
  test("TC_002 Verify in API", async ({ page }) => { /* reads item created above */ });
});
```

Serial mode ensures TC_002 runs only after TC_001 completes. Without this, `fullyParallel: true` would run them simultaneously.

### 7. Unique User Generation

TS_001 generates unique emails using timestamps to avoid collisions across test runs:

```ts
function uniqueEmail(): string {
  return `e2e+${Date.now()}@test.io`;
}
```

This ensures each test run creates a fresh user with no leftover data from previous runs.

### 8. Environment-Based Credentials

Tests beyond TS_001 use a pre-registered user loaded from `.env`:

```ts
const email = process.env.email || "";
const password = process.env.password || "";
```

This separates test data from test logic and allows running against different environments by changing the `.env` file.

---

## Test File Anatomy

Every test file follows a consistent structure:

```ts
import { test, expect } from "@playwright/test";
import { login, getItems, createItem } from "../helpers/api";

test.describe("TS_XXX Scenario Name", () => {
  // Optional: force serial execution
  test.describe.configure({ mode: "serial" });

  // Optional: shared state across tests in this describe block
  let token: string;

  test("TS_XXX_TC_001 Test case name", async ({ page, request }) => {
    // 1. Setup — create data via API or navigate to correct page
    // 2. Action — perform the action being tested (UI or API)
    // 3. UI Verification — assert what the browser shows
    // 4. API Verification — assert what the API returns
  });
});
```

---

## How to Add a New Test

1. **Create the spec file**: Add `tests/scenarios/TS_XXX_your_scenario.spec.ts`
2. **Import helpers**: Use `import { login, getItems, ... } from "../helpers/api"`
3. **Write setup**: Register/login a user, create any prerequisite data
4. **Perform action**: Interact with the UI or API
5. **Assert both layers**: Verify UI shows correct state AND API returns correct data
6. **Run**: `npx playwright test tests/scenarios/TS_XXX_your_scenario.spec.ts`

---

## Debugging Failed Tests

### Trace Viewer

After a failed test retries, Playwright saves a trace file. Open it with:

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

The trace viewer shows a timeline of every action with screenshots, DOM snapshots, network requests, and console logs.

### Debug Mode

Run a single test in debug mode to step through it:

```bash
npx playwright test -g "TS_001_TC_001" --debug
```

This opens the Playwright Inspector where you can step through actions, inspect locators, and see the browser in real time.

### HTML Report

After any test run, generate and view the report:

```bash
npx playwright show-report
```

Shows pass/fail status for every test, with error messages, screenshots, and traces attached to failed tests.

### Video Recording

Videos are saved for retried tests in `test-results/`. Play them to see exactly what happened in the browser during the test.
