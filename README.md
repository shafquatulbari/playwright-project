# Playwright Full-Stack Demo

A small full-stack app to practice API vs UI consistency testing with Playwright.

Features:

- Header shows app title and current user (Signed in as ...)
- Auth: Register and Login (JWT)
- CRUD: Create, list, update, delete tasks
- Drag & Drop: Move tasks across Todo, Doing, Done columns with persisted order
- Priority and timestamps: Each task has priority and created/updated times
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
- `GET /api/items` (auth) → returns array of items with fields below
- `POST /api/items` { title, description?, column?="todo", priority?="normal" } (auth)
- `PUT /api/items/:id` { title?, description?, column?, priority? } (auth)
- `DELETE /api/items/:id` (auth)
- `POST /api/items/reorder` { orderMap: { [column]: [ids] } } (auth)

Item shape:

```
{
   id: string,
   title: string,
   description?: string,
   column: 'todo' | 'doing' | 'done',
   order: number,
   priority: 'low' | 'normal' | 'high' | 'urgent',
   createdAt: number, // epoch ms
   updatedAt: number  // epoch ms
}
```

### UI pages

- Login / Register
- Board with Todo, Doing, Done columns
  - Header: app title, signed-in user, quick add with priority, refresh, logout
  - Cards: title, id suffix, status (column), priority, created/updated timestamps

## Playwright testing

E2E coverage includes:

- Register + login
- CRUD lifecycle
- Drag & drop reorder across columns
- API vs UI consistency: for each column (Todo/Doing/Done), compare items returned by API with elements rendered in the UI

See `docs/test-plan.md` for manual test scenarios and cases with IDs.

API reference: see `docs/api.md`.

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
