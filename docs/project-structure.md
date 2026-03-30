# Project Structure Reference

This document provides a detailed explanation of every file and folder in the project.

## Root Directory

### Configuration Files

| File | Purpose |
| --- | --- |
| `package.json` | Root package manager config. Defines npm scripts for running the app and tests, plus dev dependencies (Playwright, TypeScript types) and runtime dependencies (dotenv). |
| `playwright.config.ts` | Playwright test runner configuration. Controls browser selection, timeouts, parallelism, base URL, trace/video recording, and reporter output. See [playwright-guide.md](playwright-guide.md) for full parameter breakdown. |
| `tsconfig.playwright.json` | TypeScript compiler configuration scoped to the test files. Targets ES2020, enables strict mode, and includes `@playwright/test` type definitions for IDE autocomplete. |
| `.env` | Environment variables loaded by tests at runtime. Contains test user credentials (`email`, `password`, `name`) and optionally `API_BASE`. Not committed to git. |

### npm Scripts (Root package.json)

| Script | Command | What It Does |
| --- | --- | --- |
| `install:all` | `npm --prefix backend install && npm --prefix frontend install` | Installs dependencies for both backend and frontend in one command. |
| `dev:backend` | `npm --prefix backend run dev` | Starts the backend Express server with nodemon (auto-restarts on file changes). |
| `dev:frontend` | `npm --prefix frontend run dev` | Starts the frontend Vite dev server with hot module replacement. |
| `test:e2e` | `playwright test` | Runs all Playwright tests in headless mode (no visible browser). Best for CI. |
| `test:ui` | `playwright test --ui` | Opens the Playwright Test UI — an interactive panel to browse, run, and debug tests. |
| `test` | `playwright test --ui --headed` | Opens both the UI panel and visible browser windows. Best for learning and development. |
| `test:headed` | `playwright test --headed` | Runs tests with visible browsers but without the interactive UI panel. Good for demos. |

---

## backend/

The Express.js REST API server providing authentication and todo item management.

### backend/src/server.js

The application entry point. Sets up:
- **CORS** — allows requests from `http://localhost:5173` (the frontend)
- **Morgan** — HTTP request logging in `dev` format for debugging
- **JSON body parser** — parses incoming `application/json` request bodies
- **Routes** — mounts `/api/auth` and `/api/items` route handlers
- **Health check** — `GET /health` returns `{ status: "ok" }` for uptime monitoring
- **Error handler** — catches unhandled errors and returns a 500 JSON response
- **Startup** — listens on `process.env.PORT` (default 4000)

### backend/src/db.js

Database initialization using NeDB (a lightweight, file-based NoSQL database similar to MongoDB). Creates two datastores:
- **users.db** — stores user accounts with a unique index on `email` to prevent duplicate registrations
- **items.db** — stores todo items with an index on `userId` for fast per-user queries

Both files are stored in `backend/data/` and created automatically on first run.

### backend/src/middleware/auth.js

JWT authentication middleware. Exports two functions:
- **`signToken(payload, options)`** — creates a signed JWT with a 7-day expiration using the `JWT_SECRET` environment variable
- **`authRequired(req, res, next)`** — Express middleware that extracts the Bearer token from the `Authorization` header, verifies it, and attaches the decoded user to `req.user`. Returns 401 if the token is missing or invalid.

### backend/src/routes/auth.js

Authentication endpoints:
- **`POST /api/auth/register`** — accepts `{ name, email, password }`, hashes the password with bcrypt, inserts a user record, and returns a JWT token plus user info. Returns 400 for missing fields, 409 if the email already exists.
- **`POST /api/auth/login`** — accepts `{ email, password }`, looks up the user, verifies the password with bcrypt, and returns a token. Returns 400 for missing fields, 401 for wrong credentials.

### backend/src/routes/items.js

Todo item CRUD endpoints (all protected by the `authRequired` middleware):
- **`GET /api/items`** — returns all items belonging to the authenticated user, sorted by column then order
- **`POST /api/items`** — creates a new item with defaults (`column: "todo"`, `priority: "normal"`, `order: count + 1`). Returns 400 if title is missing.
- **`PUT /api/items/:id`** — updates specific fields of an item. Only updates fields that are provided in the request body. Updates `updatedAt` timestamp.
- **`DELETE /api/items/:id`** — removes an item from the database
- **`POST /api/items/reorder`** — batch operation that updates `column` and `order` for multiple items at once. Used when dragging items between columns or reordering within a column.

All queries are scoped to `userId` from the JWT, ensuring users can only access their own items.

### backend/.env.example

Template showing available environment variables:
- `PORT` — server port (default 4000)
- `JWT_SECRET` — secret for signing JWTs (default "dev-secret")

---

## frontend/

The React single-page application providing the todo board UI.

### frontend/src/main.jsx

Application entry point. Renders the `<App />` component into the `#root` DOM element with React StrictMode enabled.

### frontend/src/App.jsx

Root component that wraps the app in an `AuthProvider` context and conditionally renders:
- **Auth forms** (Login/Register) when the user is not logged in
- **Board** when the user is authenticated

### frontend/src/AuthContext.jsx

React Context that manages authentication state across the application:
- Stores the current `user` object and provides `login()`, `register()`, and `logout()` functions
- Reads the JWT token from `localStorage` on mount to persist sessions across page reloads
- All child components can access auth state via `useContext(AuthContext)`

### frontend/src/lib/api.js

Centralized API client module. Provides helper functions that wrap `fetch()` calls:
- `register(name, email, password)` — calls POST /api/auth/register
- `login(email, password)` — calls POST /api/auth/login
- `list()` — calls GET /api/items
- `create(data)` — calls POST /api/items
- `update(id, data)` — calls PUT /api/items/:id
- `remove(id)` — calls DELETE /api/items/:id
- `reorder(orderMap)` — calls POST /api/items/reorder

All authenticated requests automatically attach the Bearer token from `localStorage`.

### frontend/src/pages/Login.jsx

Login form component with email and password fields. Uses `data-testid` attributes for Playwright test selectors:
- `login-email` — email input field
- `login-password` — password input field
- `login-submit` — submit button
- `switch-to-register` — link to switch to registration form

### frontend/src/pages/Register.jsx

Registration form component with name, email, and password fields. Uses `data-testid` attributes:
- `register-name` — name input field
- `register-email` — email input field
- `register-password` — password input field
- `register-submit` — submit button
- `switch-to-login` — link to switch to login form

### frontend/src/pages/Board.jsx

The main application view. Displays:
- **Header bar** — app title, "Signed in as {name}", quick-add form (title + priority dropdown), Refresh button, Logout button
- **Three columns** — Todo, Doing, Done — each showing item cards
- **Item cards** — display title, ID suffix, status, priority, and timestamps. Each card has a Delete button.
- **Drag and drop** — native HTML5 drag events. Dragging an item to another column or position triggers a reorder API call.

Key `data-testid` attributes used by tests:
- `column-todo`, `column-doing`, `column-done` — column containers
- `item-{id}` — individual item cards
- `new-item-title` — quick-add title input
- `new-item-priority` — priority dropdown select
- `add-item` — add button
- `refresh` — refresh button
- `logout` — logout button
- `delete-{id}` — per-item delete button

### frontend/src/styles.css

Global stylesheet with a dark theme. Defines:
- Dark background (#0b0b0c) with light text (#e8e8ea)
- CSS Grid layout for the three-column board
- Styled inputs, buttons, selects, and item cards
- Grab cursor on draggable items for visual feedback

---

## tests/

The Playwright E2E test suite.

### tests/helpers/api.ts

Reusable API helper functions that wrap Playwright's built-in `APIRequestContext`. These allow tests to make direct HTTP calls to the backend without going through the browser UI. Functions:

| Function | Parameters | Returns | Purpose |
| --- | --- | --- | --- |
| `register()` | `request`, `name`, `email`, `password` | `{ token, user }` | Register a new user via API |
| `login()` | `request`, `email`, `password` | `{ token, user }` | Login and get a JWT token |
| `getItems()` | `request`, `token` | `Item[]` | Fetch all items for the authenticated user |
| `createItem()` | `request`, `token`, `data` | `Item` | Create a new item |
| `updateItem()` | `request`, `token`, `id`, `data` | `Item` | Update an existing item |
| `deleteItem()` | `request`, `token`, `id` | `boolean` | Delete an item, returns success status |
| `reorder()` | `request`, `token`, `orderMap` | `Item[]` | Batch reorder/move items across columns |

The `API_BASE` defaults to `http://localhost:4000` but can be overridden via the `API_BASE` environment variable.

### tests/scenarios/

Each file corresponds to one test scenario from the test plan. Files are prefixed with their scenario ID for easy reference.

| File | Scenario | Tests | Description |
| --- | --- | --- | --- |
| `TS_001_registration_login.spec.ts` | Registration & Login | 2 | Register a new user via UI, verify board loads. Logout and login again, verify session persists. |
| `TS_002_create_and_verify.spec.ts` | Create Item & Verify | 2 | Create item via UI, verify it appears. Cross-check API items match UI items per column. |
| `TS_003_api_update_reflects.spec.ts` | API Update Reflects in UI | 1 | Create item via API, update via API, click Refresh, verify UI shows changes. |
| `TS_004_delete_and_verify.spec.ts` | Delete & Verify | 1 | Create item via API, delete via UI, verify removal in both UI and API. |
| `TS_005_move_across_columns.spec.ts` | Move Across Columns | 1 | Create items, drag one to a different column, verify column assignment in UI and API. |
| `TS_006_reorder_within_column.spec.ts` | Reorder Within Column | 1 | Create multiple items, drag to reorder, verify order matches between UI and API. |
| `TS_007_priority_dropdown.spec.ts` | Priority & Timestamps | 2 | Create item with specific priority, verify in UI and API. Update via API, verify timestamps change. |
| `TS_008_negative_cases.spec.ts` | Negative Cases | 2 | Test wrong password login (expect error). Test empty title submission (expect rejection). |

---

## docs/

### docs/api.md
Complete REST API reference documenting every endpoint, request/response formats, and error codes.

### docs/test-plan.md
Manual test plan organized by scenarios (TS_001–TS_008) with detailed test cases, preconditions, steps, and expected results.

### docs/project-structure.md
This file. Detailed explanation of every file and folder in the project.

### docs/playwright-guide.md
Guide to the Playwright configuration, test patterns used in this project, and how to extend the test suite.
