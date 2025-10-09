# Playwright Full-Stack Demo

A small full-stack app to practice API vs UI consistency testing with Playwright.

Features:

- Auth: Register and Login (JWT)
- CRUD: Create, list, update, delete tasks
- Drag & Drop: Move tasks across Todo, Doing, Done columns
- API: Express + NeDB (file-based DB) for easy local setup
- UI: Vite + React with a simple, clean layout

## Getting started

Prereqs: Node.js 18+

1. Backend

   - Copy `.env.example` to `.env` (optional)
   - Install deps and run the API server

2. Frontend
   - Install deps and start the dev server

The UI runs on http://localhost:5173 and the API on http://localhost:4000

### Backend

Env vars (optional):

- `PORT=4000`
- `JWT_SECRET=change-me-in-prod`

### API endpoints

- `POST /api/auth/register` { name, email, password } → { token, user }
- `POST /api/auth/login` { email, password } → { token, user }
- `GET /api/items` (auth)
- `POST /api/items` { title, description?, column? } (auth)
- `PUT /api/items/:id` { title?, description?, column? } (auth)
- `DELETE /api/items/:id` (auth)
- `POST /api/items/reorder` { orderMap: { [column]: [ids] } } (auth)

### UI pages

- Login / Register
- Board with Todo, Doing, Done columns

## Playwright testing

We'll later add Playwright e2e covering:

- Register + login
- CRUD lifecycle
- Drag & drop reorder across columns
- API vs UI consistency: compare API response bodies to what is rendered

See `docs/test-plan.md` (to be added) for manual test scenarios and cases.

## Run locally

In one terminal:

```
cd backend
npm install
npm run dev
```

In another terminal:

```
cd frontend
npm install
npm run dev
```

Open http://localhost:5173
Automation Testing a Demo App with Playwright including API against UI validations
