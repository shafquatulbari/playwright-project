const API_BASE = process.env.API_BASE || "http://localhost:4000";

export async function register(request, name, email, password) {
  const res = await request.post(`${API_BASE}/api/auth/register`, {
    data: { name, email, password },
  });
  return await res.json();
}

export async function login(request, email, password) {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email, password },
  });
  return await res.json();
}

export async function getItems(request, token) {
  const res = await request.get(`${API_BASE}/api/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}

export async function createItem(request, token, data) {
  const res = await request.post(`${API_BASE}/api/items`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  return await res.json();
}

export async function updateItem(request, token, id, data) {
  const res = await request.put(`${API_BASE}/api/items/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  return await res.json();
}

export async function deleteItem(request, token, id) {
  const res = await request.delete(`${API_BASE}/api/items/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok();
}

export async function reorder(request, token, orderMap) {
  const res = await request.post(`${API_BASE}/api/items/reorder`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { orderMap },
  });
  return await res.json();
}
