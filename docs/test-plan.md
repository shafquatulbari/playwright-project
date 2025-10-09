# Test Plan (Manual)

Scope: Validate end-to-end behavior of the demo app, with special focus on matching API responses to UI rendering.

Environments

- UI: http://localhost:5173
- API: http://localhost:4000

Data policy

- Use a unique email per run (e.g., e2e+<timestamp>@test.io) to avoid clashes.

References

- Auth: `POST /api/auth/register`, `POST /api/auth/login`
- Items: `GET /api/items`, `POST /api/items`, `PUT /api/items/:id`, `DELETE /api/items/:id`, `POST /api/items/reorder`

## Scenarios and Test Cases

1. Register and Login

   - Steps:
     1. Open UI, click “Register”.
     2. Enter name, unique email, password.
     3. Submit. Expect to land on the Board with header and Logout.
     4. Click Logout. Expect to see Login form.
   - API vs UI: After registration, token is stored in localStorage and subsequent API calls are authorized (verify by calling GET /api/items in devtools and expect 200 and []).

2. Create Item (UI → API)

   - Steps:
     1. Login via UI.
     2. Enter a new task title (e.g., “First Task”), click Add.
     3. Expect item appears in Todo column.
     4. Using network inspector or curl with the stored token, call GET /api/items; expect to see the new item present with column=todo.
   - API vs UI: Confirm UI shows the same item count and title present in the API response.

3. Update Item (API → UI)

   - Steps:
     1. With at least one existing item, call PUT /api/items/:id to change the title (e.g., to “Renamed”).
     2. In UI, click Refresh.
     3. Expect the updated title to be displayed.
   - API vs UI: Compare the set of titles per column returned by GET /api/items to the DOM titles per column (order-insensitive for this case unless testing order specifically).

4. Delete Item (UI ↔ API)

   - Steps:
     1. Delete an item via the UI Delete button.
     2. Verify with GET /api/items that the item is no longer present.
   - API vs UI: Counts and IDs (if inspected) match on both sides.

5. Drag & Drop Across Columns (UI → API)

   - Steps:
     1. Create 2–3 items in Todo.
     2. Drag one item to Doing.
     3. Verify via GET /api/items that the item’s column is now “doing”.
   - API vs UI: The moved item appears in Doing and not in Todo; counts match between API and UI.

6. Reorder Within Column (UI → API)

   - Steps:
     1. With multiple items in a column, drag one item after another to change order.
     2. Verify via GET /api/items the order field reflects the new order (increasing integers starting at 1 within each column).
   - API vs UI: The visual order matches the order of IDs in the API when grouped by column.

7. Negative Cases
   - Login with wrong password → UI shows error; API returns 401.
   - Create with empty title → UI disallows (no action) or shows error; API returns 400 if called directly.
   - Use expired/invalid token → API returns 401; UI should redirect to login on next fetch (manual clear token to simulate).

Acceptance Criteria

- All above scenarios pass consistently on a clean user account.
- For API vs UI checks, both item counts and item identities (IDs/titles) align per column.
