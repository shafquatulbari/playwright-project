# API Reference

Base URL: http://localhost:4000

Auth: Bearer token in `Authorization: Bearer <token>` header for protected routes.

## Auth

### POST /api/auth/register

- Body: `{ name: string, email: string, password: string }`
- 200 Response: `{ token: string, user: { id: string, email: string, name: string } }`
- Errors: 400 (missing fields), 409 (email exists)

### POST /api/auth/login

- Body: `{ email: string, password: string }`
- 200 Response: `{ token: string, user: { id: string, email: string, name: string } }`
- Errors: 400, 401

## Items (protected)

Item

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

User scoping

- Each item is owned by a single user (field: `userId`).
- All item queries and mutations are scoped to the authenticated user.
  - Example: `GET /api/items` fetches items with `userId` matching the JWT claim.
  - `POST /api/items`, `PUT /api/items/:id`, `DELETE /api/items/:id`, and `POST /api/items/reorder` all enforce `userId` filters server-side.
- This ensures each user has their own unique list; users cannot read or modify others’ items.

### GET /api/items

- Response: `Item[]` sorted by `(column ASC, order ASC)`

Example:

```
GET /api/items
Authorization: Bearer <token>
```

### POST /api/items

- Body: `{ title: string, description?: string, column?: 'todo'|'doing'|'done', priority?: 'low'|'normal'|'high'|'urgent' }`
- Defaults: `column='todo'`, `priority='normal'`
- 201 Response: `Item`

Example:

```
POST /api/items
Authorization: Bearer <token>
Content-Type: application/json

{ "title": "My task", "priority": "high" }
```

### PUT /api/items/:id

- Body: `{ title?, description?, column?, priority? }`
- 200 Response: `Item`

Example:

```
PUT /api/items/ITEM_ID
Authorization: Bearer <token>
Content-Type: application/json

{ "title": "Renamed", "priority": "urgent" }
```

### DELETE /api/items/:id

- 204 Response

Example:

```
DELETE /api/items/ITEM_ID
Authorization: Bearer <token>
```

### POST /api/items/reorder

- Body: `{ orderMap: { [column in 'todo'|'doing'|'done']: string[] } }`
- Reassigns `order` and `column` for the provided ids, and updates `updatedAt`
- 200 Response: `Item[]` (new ordering)

Example:

```
POST /api/items/reorder
Authorization: Bearer <token>
Content-Type: application/json

{ "orderMap": { "todo": [], "doing": ["idA", "idB"], "done": [] } }
```

## Error shape

```
{ "error": string }
```
