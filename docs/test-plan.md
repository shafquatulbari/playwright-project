# Test Plan (Manual)

Scope: Validate end-to-end behavior with emphasis on API ↔ UI consistency per column (Todo, Doing, Done), and item details (priority, timestamps).

Environments

- UI: http://localhost:5173
- API: http://localhost:4000

Data policy

- Use a unique email per run (e.g., e2e+<timestamp>@test.io) to avoid clashes.

References

- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Items: `GET /api/items`, `POST /api/items`, `PUT /api/items/:id`, `DELETE /api/items/:id`, `POST /api/items/reorder`

## Scenarios Overview

| Scenario ID | Title                         | Description                                     |
| ----------- | ----------------------------- | ----------------------------------------------- |
| TS_001      | Registration and Login        | Register and login; verify header shows user.   |
| TS_002      | Create Item and Verify in API | Create via UI; verify in API under Todo.        |
| TS_003      | API Update Reflects in UI     | Update via API; Refresh UI to verify.           |
| TS_004      | Delete Item and Verify in API | Delete via UI; confirm removal via API.         |
| TS_005      | Move Item Across Columns      | Drag Todo→Doing; verify in API and UI.          |
| TS_006      | Reorder Items Within Column   | Reorder; verify API order matches UI.           |
| TS_007      | Priority and Timestamps       | Verify priority creation and updatedAt changes. |
| TS_008      | Negative Cases                | Invalid login, empty title, invalid token.      |

## Detailed Test Cases

### TS_001: Registration and Login

| Test Case ID  | Pre-conditions        | Steps                                                                            | Expected Result                                        |
| ------------- | --------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------ |
| TS_001_TC_001 | None                  | 1) Open UI 2) Switch to Register 3) Enter name, unique email, password 4) Submit | Board loads. Header shows “Signed in as <name/email>”. |
| TS_001_TC_002 | Newly registered user | 1) Logout 2) Switch to Login 3) Enter same credentials 4) Submit                 | Board loads with empty columns (Todo/Doing/Done).      |

### TS_002: Create Item and Verify in API

| Test Case ID  | Pre-conditions | Steps                                                              | Expected Result                                                                       |
| ------------- | -------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| TS_002_TC_001 | Logged in      | 1) Enter title “First Task” 2) Choose priority Normal 3) Click Add | Card appears in Todo with priority and timestamps.                                    |
| TS_002_TC_002 | After TC_001   | 1) Call GET /api/items with token 2) Group by column               | API shows the new item under todo; UI Todo count equals API Todo count; titles match. |

### TS_003: API Update Reflects in UI

| Test Case ID  | Pre-conditions | Steps                                                                 | Expected Result                                                     |
| ------------- | -------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------- |
| TS_003_TC_001 | Item exists    | 1) PUT /api/items/:id to change title/priority 2) Click Refresh in UI | UI shows updated title/priority; updatedAt increases in UI and API. |

### TS_004: Delete Item and Verify in API

| Test Case ID  | Pre-conditions | Steps                       | Expected Result                                                                |
| ------------- | -------------- | --------------------------- | ------------------------------------------------------------------------------ |
| TS_004_TC_001 | Item exists    | 1) Click Delete on the card | API no longer returns the item; UI count decrements; item removed from column. |

### TS_005: Move Item Across Columns

| Test Case ID  | Pre-conditions   | Steps                   | Expected Result                                                                                        |
| ------------- | ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| TS_005_TC_001 | 2+ items in Todo | 1) Drag a card to Doing | UI shows card in Doing; GET /api/items shows column='doing'; counts match in Doing and adjust in Todo. |

### TS_006: Reorder Items Within Column

| Test Case ID  | Pre-conditions       | Steps                                 | Expected Result                                                                          |
| ------------- | -------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------- |
| TS_006_TC_001 | 2+ items in a column | 1) Drag to reorder within same column | API order fields (1..N) reflect visual order; UI order equals API order for that column. |

### TS_007: Priority and Timestamps

| Test Case ID  | Pre-conditions | Steps                                | Expected Result                                                                                    |
| ------------- | -------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| TS_007_TC_001 | Logged in      | 1) Add item with priority=Urgent     | UI shows priority Urgent; GET /api/items shows priority='urgent' and createdAt/updatedAt non-null. |
| TS_007_TC_002 | Existing item  | 1) Update item via API 2) Refresh UI | UI updatedAt increases and matches API updatedAt (± clock skew).                                   |

### TS_008: Negative Cases

| Test Case ID  | Pre-conditions | Steps                                 | Expected Result                                         |
| ------------- | -------------- | ------------------------------------- | ------------------------------------------------------- |
| TS_008_TC_001 | None           | 1) Login with wrong password          | UI error; API 401.                                      |
| TS_008_TC_002 | None           | 1) Try to add with empty title        | UI prevents or shows error; API 400 if called directly. |
| TS_008_TC_003 | Logged in      | 1) Clear/alter token 2) Trigger fetch | API 401; UI requires re-login after next fetch.         |

Notes on API ↔ UI Column Verification

- For each relevant case, validate per column (todo, doing, done):
  - From API: GET /api/items → group by column → map to titles (and/or ids)
  - From UI: Query within `data-testid="column-todo|doing|done"` → collect `.item .title`
  - Assert column counts match, and sets (or lists when verifying order) match between API and UI.
