# Test Plan

Scope: Validate end-to-end behavior with emphasis on API ↔ UI consistency per column (Todo, Doing, Done), and item details (priority, timestamps).

## Test Environments

| Environment | URL | Purpose |
| --- | --- | --- |
| UI (Frontend) | http://localhost:5173 | React app served by Vite |
| API (Backend) | http://localhost:4000 | Express.js REST API |

Both must be running before tests execute. See the [README](../README.md) for startup instructions.

## Data Policy

- **TS_001** generates a unique email per run using `e2e+<timestamp>@test.io` to avoid collisions with previous test data.
- **TS_002–TS_008** use a pre-registered user whose credentials are loaded from the `.env` file in the project root.
- NeDB is a file-based database — data persists between runs. To start fresh, stop the backend and delete the `backend/data/` directory.

## API Endpoints Used by Tests

| Endpoint | Auth | Purpose in Tests |
| --- | --- | --- |
| `POST /api/auth/register` | No | Create new test users |
| `POST /api/auth/login` | No | Obtain JWT tokens for API verification calls |
| `GET /api/items` | Yes | Fetch all items to verify against UI state |
| `POST /api/items` | Yes | Create items as test preconditions (setup) |
| `PUT /api/items/:id` | Yes | Update items to test API→UI reflection |
| `DELETE /api/items/:id` | Yes | Verify deletion propagates to API |
| `POST /api/items/reorder` | Yes | Verify drag-and-drop persistence |

## Test Helper Functions (tests/helpers/api.ts)

These functions wrap Playwright's `APIRequestContext` to make direct HTTP calls to the backend:

| Function | Parameters | Purpose |
| --- | --- | --- |
| `register(request, name, email, password)` | Playwright request context, user details | Register a user and return `{ token, user }` |
| `login(request, email, password)` | Playwright request context, credentials | Login and return `{ token, user }` |
| `getItems(request, token)` | Request context, JWT token | Fetch all items for the authenticated user |
| `createItem(request, token, data)` | Request context, token, `{ title, priority?, column? }` | Create an item and return the created item |
| `updateItem(request, token, id, data)` | Request context, token, item ID, fields to update | Update an item and return the updated item |
| `deleteItem(request, token, id)` | Request context, token, item ID | Delete an item, returns boolean success |
| `reorder(request, token, orderMap)` | Request context, token, `{ [column]: [ids] }` | Batch reorder items across columns |

## Scenarios Overview

| Scenario ID | Title | # Tests | Key Verification |
| --- | --- | --- | --- |
| TS_001 | Registration and Login | 2 | Auth flow works; header shows user; empty board matches API |
| TS_002 | Create Item and Verify in API | 2 | Item created via UI appears in API; column counts match |
| TS_003 | API Update Reflects in UI | 1 | API mutation visible in UI after Refresh |
| TS_004 | Delete Item and Verify in API | 1 | UI deletion removes item from API response |
| TS_005 | Move Item Across Columns | 1 | Drag-and-drop changes column in both UI and API |
| TS_006 | Reorder Items Within Column | 1 | Drag-to-reorder updates order field in API |
| TS_007 | Priority and Timestamps | 2 | Priority persists; updatedAt changes on mutation |
| TS_008 | Negative Cases | 2 | Wrong password shows error; empty title rejected |

## Detailed Test Cases

### TS_001: Registration and Login

**Purpose**: Verify the authentication flow and that the UI state matches the API state for a new user.

| Test Case ID | Pre-conditions | Steps | Expected Result |
| --- | --- | --- | --- |
| TS_001_TC_001 | None | 1) Open UI 2) Switch to Register 3) Enter name, unique email, password 4) Submit | Board loads. Header shows "Signed in as {name}". API login returns valid token. API items list is empty. UI columns match API (all empty). |
| TS_001_TC_002 | Pre-registered user (from `.env`) | 1) Navigate to UI 2) Logout if needed 3) Switch to Login 4) Enter .env credentials 5) Submit | Board loads. Header shows "Signed in as {name}". API and UI item counts match per column. |

**What This Tests**:
- Registration creates a valid user in the database
- JWT token is issued and works for subsequent API calls
- Login with existing credentials works
- UI and API agree on the user's data from the very first session

---

### TS_002: Create Item and Verify in API

**Purpose**: Verify that creating an item through the UI persists it to the database and the API returns matching data.

**Mode**: Serial (TC_002 depends on TC_001's created item)

| Test Case ID | Pre-conditions | Steps | Expected Result |
| --- | --- | --- | --- |
| TS_002_TC_001 | Logged in | 1) Enter title "First Task" 2) Choose priority Normal 3) Click Add | Card appears in Todo column with correct title, priority badge, and timestamps. |
| TS_002_TC_002 | After TC_001 | 1) Call GET /api/items with token 2) Group by column | API shows the item under "todo" column. UI Todo count equals API Todo count. Item titles and IDs match between UI and API. |

**What This Tests**:
- The quick-add form creates items correctly
- Default column ("todo") and priority ("normal") are applied
- Timestamps (createdAt, updatedAt) are populated
- API returns the same data the UI displays

---

### TS_003: API Update Reflects in UI

**Purpose**: Verify that changes made directly via the API become visible in the UI after clicking Refresh.

| Test Case ID | Pre-conditions | Steps | Expected Result |
| --- | --- | --- | --- |
| TS_003_TC_001 | Logged in, item exists | 1) Create item via API 2) Update title and priority via API 3) Click Refresh in UI | UI shows the updated title and priority. The `updatedAt` timestamp has increased. |

**What This Tests**:
- The Refresh button re-fetches data from the API
- API mutations are correctly reflected in the UI
- Timestamps update properly on mutations

---

### TS_004: Delete Item and Verify in API

**Purpose**: Verify that deleting an item via the UI removes it from both the UI and the API.

| Test Case ID | Pre-conditions | Steps | Expected Result |
| --- | --- | --- | --- |
| TS_004_TC_001 | Logged in, item exists | 1) Create item via API 2) Click Delete button on the card in UI | Item disappears from UI. Column item count decrements. API no longer returns the item in GET /api/items. |

**What This Tests**:
- The Delete button triggers the correct API call
- The UI removes the item immediately
- The API confirms the deletion

---

### TS_005: Move Item Across Columns

**Purpose**: Verify that dragging an item to a different column updates both the UI and the API.

| Test Case ID | Pre-conditions | Steps | Expected Result |
| --- | --- | --- | --- |
| TS_005_TC_001 | Logged in, 2+ items in Todo | 1) Create 2 items in Todo 2) Drag the first item to the Doing column | Item appears in Doing column in UI. API returns `column: "doing"` for that item. Todo count decreases, Doing count increases. |

**What This Tests**:
- HTML5 drag-and-drop triggers the reorder API call
- The `column` field is updated in the database
- Item counts per column stay consistent between UI and API

---

### TS_006: Reorder Items Within Column

**Purpose**: Verify that reordering items within a column updates the order field in the API.

| Test Case ID | Pre-conditions | Steps | Expected Result |
| --- | --- | --- | --- |
| TS_006_TC_001 | Logged in, 3 items in a column | 1) Create 3 items in Todo 2) Drag the middle item to reorder | API order fields (1, 2, 3) reflect the new visual order. After clicking Refresh, the UI order still matches the API order. |

**What This Tests**:
- Reorder within a column persists correctly
- The `order` field is updated for all affected items
- A Refresh does not change the order (data is persisted, not just in memory)

---

### TS_007: Priority and Timestamps

**Purpose**: Verify that priority is stored correctly and that timestamps update on mutations.

**Mode**: Serial (TC_002 depends on TC_001's created item)

| Test Case ID | Pre-conditions | Steps | Expected Result |
| --- | --- | --- | --- |
| TS_007_TC_001 | Logged in | 1) Add item with priority=Urgent via UI | UI shows "Urgent" priority. API returns `priority: "urgent"`. `createdAt` and `updatedAt` are non-null epoch millisecond values. |
| TS_007_TC_002 | Existing item | 1) Update item via API (change title) 2) Click Refresh in UI | `updatedAt` has increased from its previous value. UI timestamp display matches the API timestamp. |

**What This Tests**:
- Priority dropdown correctly sends the selected value to the API
- Timestamps are valid epoch millisecond numbers
- `updatedAt` changes on mutation while `createdAt` remains the same

---

### TS_008: Negative Cases

**Purpose**: Verify that invalid inputs are handled gracefully by both the UI and API.

| Test Case ID | Pre-conditions | Steps | Expected Result |
| --- | --- | --- | --- |
| TS_008_TC_001 | Existing user | 1) Attempt login with wrong password via UI | UI shows error alert. API returns 401 status code. |
| TS_008_TC_002 | Logged in | 1) Try to add item with empty title | UI prevents submission (item count does not change). API returns 400 if called directly with empty title. |

**What This Tests**:
- Error states are communicated to the user
- The API returns appropriate HTTP status codes for invalid requests
- The UI does not create invalid data

---

## API ↔ UI Column Verification Pattern

This pattern is used throughout the test suite to verify consistency:

1. **From API**: Call `GET /api/items` → group items by `column` field → extract `id` and `title` arrays
2. **From UI**: Query within `data-testid="column-{todo|doing|done}"` → collect `data-testid` attributes from item elements → extract IDs
3. **Assert**: Column counts match between API and UI. Item ID sets (or ordered lists) match between API and UI.

This dual-verification catches:
- Frontend caching bugs (UI shows stale data)
- Backend silent failures (API returns success but doesn't persist)
- Column assignment mismatches (item in wrong column)
- Ordering bugs (items in wrong sequence)
