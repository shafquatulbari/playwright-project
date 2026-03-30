# Playwright Full-Stack Testing Demo

A complete end-to-end testing project built with [Playwright](https://playwright.dev/) that demonstrates **API vs UI consistency testing** on a todo board application. The project includes a React frontend, an Express.js backend, and a comprehensive Playwright test suite that validates both layers work in sync.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [Test Commands Explained](#test-commands-explained)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Environment Variables](#environment-variables)
- [Documentation](#documentation)

## Overview

This project is designed as a learning and demonstration tool for Playwright E2E testing. It pairs a working full-stack todo board application with a structured test suite that covers:

- **User authentication** (register, login, logout)
- **CRUD operations** (create, read, update, delete todo items)
- **Drag and drop** (move items across columns, reorder within columns)
- **API vs UI consistency** (every UI action is verified against the API response and vice versa)
- **Negative testing** (invalid credentials, empty inputs, unauthorized access)

The key testing philosophy is: **for every action, verify both the UI state and the API state match**. This catches bugs where the frontend renders stale data or the backend silently fails.

## Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Playwright │ ──UI──▶ │   Frontend   │ ──API─▶ │   Backend    │
│   Tests      │ ──API─▶ │   React+Vite │         │  Express+NeDB│
│              │         │  :5173       │         │  :4000       │
└──────────────┘         └──────────────┘         └──────────────┘
```

- **Frontend** (port 5173): React SPA built with Vite. Provides the todo board UI with three columns (Todo, Doing, Done).
- **Backend** (port 4000): Express.js REST API with NeDB file-based database. Handles auth (JWT) and all CRUD operations.
- **Tests**: Playwright test suite that interacts with both the UI (browser) and API (HTTP requests) simultaneously.

## Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- Playwright browsers (installed automatically on first test run, or manually with `npx playwright install`)

## Installation

### Quick Setup (all at once)

```bash
npm install              # install root dependencies (Playwright, dotenv)
npm run install:all      # install backend + frontend dependencies
npx playwright install   # download browser binaries (Chromium, WebKit)
```

### Manual Setup (step by step)

```bash
# 1. Root dependencies
npm install

# 2. Backend
cd backend
cp .env.example .env     # optional: customize port and JWT secret
npm install
cd ..

# 3. Frontend
cd frontend
npm install
cd ..

# 4. Playwright browsers
npx playwright install
```

## Running the Application

You need **both** the backend and frontend running before executing tests.

### Terminal 1 - Backend

```bash
npm run dev:backend
# or manually: cd backend && npm run dev
```

The API server starts at **http://localhost:4000**. You should see `Server running on port 4000` in the console.

### Terminal 2 - Frontend

```bash
npm run dev:frontend
# or manually: cd frontend && npm run dev
```

The React app starts at **http://localhost:5173**. Open this URL in a browser to see the todo board.

## Running Tests

With both servers running, open a **third terminal** for tests:

```bash
# Interactive UI mode (recommended for learning)
npm test

# Headless mode (for CI/pipelines)
npm run test:e2e

# Headed mode without UI panel
npm run test:headed

# Playwright interactive UI mode only
npm run test:ui
```

## Test Commands Explained

| Command             | What It Does                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `npm test`          | Opens Playwright UI mode with headed browsers. Best for development — you can watch tests run, inspect steps, and re-run individual tests. |
| `npm run test:e2e`  | Runs all tests headlessly (no browser window). Ideal for CI/CD pipelines and automated runs.         |
| `npm run test:headed` | Runs tests with visible browser windows but without the Playwright UI panel. Good for demos.       |
| `npm run test:ui`   | Opens only the Playwright UI panel for interactive test selection, debugging, and step-through.       |

### Useful Playwright CLI Flags

You can append flags to any test command:

```bash
# Run a specific test file
npx playwright test tests/scenarios/TS_001_registration_login.spec.ts

# Run tests matching a name pattern
npx playwright test -g "TS_001"

# Run only in Chromium
npx playwright test --project=chromium

# Run only in WebKit (Safari)
npx playwright test --project=webkit

# Generate and open HTML report after run
npx playwright test && npx playwright show-report

# Run with debug mode (step through with inspector)
npx playwright test --debug

# Run with specific number of workers
npx playwright test --workers=1
```

## Project Structure

```
playwright-project/
│
├── backend/                    # Express.js REST API server
│   ├── src/
│   │   ├── server.js          # App entry point, middleware setup, route mounting
│   │   ├── db.js              # NeDB database initialization (users + items)
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT token creation and validation middleware
│   │   └── routes/
│   │       ├── auth.js        # POST /register, POST /login endpoints
│   │       └── items.js       # CRUD + reorder endpoints for todo items
│   ├── data/                  # Auto-created NeDB database files (gitignored)
│   ├── .env.example           # Template for environment variables
│   └── package.json           # Backend dependencies and scripts
│
├── frontend/                   # React + Vite single-page application
│   ├── src/
│   │   ├── main.jsx           # React DOM render entry point
│   │   ├── App.jsx            # Root component, auth routing logic
│   │   ├── AuthContext.jsx    # React context for auth state (token, user)
│   │   ├── lib/
│   │   │   └── api.js         # HTTP client wrapping all API calls
│   │   ├── pages/
│   │   │   ├── Login.jsx      # Login form component
│   │   │   ├── Register.jsx   # Registration form component
│   │   │   └── Board.jsx      # Main board with 3 columns, drag-and-drop
│   │   └── styles.css         # Global dark-theme styles
│   ├── index.html             # HTML shell for Vite
│   ├── vite.config.js         # Vite configuration (React plugin, proxy)
│   └── package.json           # Frontend dependencies and scripts
│
├── tests/                      # Playwright E2E test suite
│   ├── helpers/
│   │   └── api.ts             # Reusable API helper functions for tests
│   └── scenarios/             # Test scenario files (one per feature area)
│       ├── TS_001_registration_login.spec.ts
│       ├── TS_002_create_and_verify.spec.ts
│       ├── TS_003_api_update_reflects.spec.ts
│       ├── TS_004_delete_and_verify.spec.ts
│       ├── TS_005_move_across_columns.spec.ts
│       ├── TS_006_reorder_within_column.spec.ts
│       ├── TS_007_priority_dropdown.spec.ts
│       └── TS_008_negative_cases.spec.ts
│
├── docs/                       # Documentation
│   ├── api.md                 # Complete API endpoint reference
│   ├── test-plan.md           # Manual test plan with scenario/case IDs
│   ├── project-structure.md   # Detailed file-by-file breakdown
│   └── playwright-guide.md    # Playwright config and test patterns guide
│
├── playwright.config.ts        # Playwright test runner configuration
├── tsconfig.playwright.json    # TypeScript settings for test files
├── package.json                # Root package: scripts, Playwright dependency
└── .env                        # Environment variables for tests (gitignored)
```

For a detailed explanation of every file and folder, see [docs/project-structure.md](docs/project-structure.md).

## Configuration

### playwright.config.ts

This is the central Playwright configuration file. Key settings:

| Setting                    | Value                | Purpose                                                                 |
| -------------------------- | -------------------- | ----------------------------------------------------------------------- |
| `testDir`                  | `"tests"`            | Directory where Playwright looks for `.spec.ts` files                   |
| `timeout`                  | `60000` (60s)        | Maximum time a single test can run before it is killed                   |
| `expect.timeout`           | `10000` (10s)        | Maximum time for assertions like `toBeVisible()` to resolve             |
| `fullyParallel`            | `true`               | Tests run in parallel across files (faster execution)                   |
| `baseURL`                  | `http://localhost:5173` | Base URL for `page.goto("/")` — resolves relative paths              |
| `headless`                 | `false`              | Browsers open visibly so you can watch tests run                        |
| `slowMo`                   | `2000`               | Adds a 2-second pause before each browser action (for observation)      |
| `trace`                    | `"on-first-retry"`   | Records a trace file on the first retry of a failed test                |
| `video`                    | `"on-first-retry"`   | Records a video on the first retry of a failed test                     |
| `reporter`                 | `list` + `html`      | Console output during run + HTML report after run                       |
| `projects`                 | Chromium, WebKit     | Tests run in both Chrome and Safari engines                             |

### tsconfig.playwright.json

TypeScript compiler settings for the test files. Targets ES2020 and includes Playwright type definitions so your IDE provides autocomplete and type checking for test code.

## Environment Variables

### Backend (.env)

| Variable      | Default            | Description                           |
| ------------- | ------------------ | ------------------------------------- |
| `PORT`        | `4000`             | Port the Express server listens on    |
| `JWT_SECRET`  | `"dev-secret"`     | Secret key used to sign JWT tokens    |

### Tests (.env in project root)

| Variable   | Default | Description                                                    |
| ---------- | ------- | -------------------------------------------------------------- |
| `email`    | —       | Email for pre-existing test user (used by TS_002+ scenarios)   |
| `password` | —       | Password for pre-existing test user                            |
| `name`     | —       | Display name for pre-existing test user                        |
| `API_BASE` | `http://localhost:4000` | Base URL for API calls in test helpers              |

To set up the test user, create a `.env` file in the project root:

```env
email=testuser@example.com
password=Password123!
name=Test User
```

Then register this user manually or via TS_001 before running the remaining test suites.

## Documentation

| Document | Description |
| --- | --- |
| [docs/api.md](docs/api.md) | Complete REST API reference with request/response examples |
| [docs/test-plan.md](docs/test-plan.md) | Manual test plan with all scenario and test case IDs |
| [docs/project-structure.md](docs/project-structure.md) | Detailed explanation of every file and folder |
| [docs/playwright-guide.md](docs/playwright-guide.md) | Playwright configuration reference and test pattern guide |
