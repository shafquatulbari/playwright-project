import type { APIRequestContext } from "@playwright/test";
import dotenv from "dotenv";
dotenv.config();

const API_BASE =
  (globalThis as any).process?.env?.API_BASE ?? "http://localhost:4000";

export async function register(
  request: APIRequestContext,
  name: string,
  email: string,
  password: string
) {
  const res = await request.post(`${API_BASE}/api/auth/register`, {
    data: { name, email, password },
  });
  return await res.json();
}

export async function login(
  request: APIRequestContext,
  email: string,
  password: string
) {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email, password },
  });
  return await res.json();
}

export async function getItems(request: APIRequestContext, token: string) {
  const res = await request.get(`${API_BASE}/api/items`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return await res.json();
}

export async function createItem(
  request: APIRequestContext,
  token: string,
  data: any
) {
  const res = await request.post(`${API_BASE}/api/items`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  return await res.json();
}

export async function updateItem(
  request: APIRequestContext,
  token: string,
  id: string,
  data: any
) {
  const res = await request.put(`${API_BASE}/api/items/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  return await res.json();
}

export async function deleteItem(
  request: APIRequestContext,
  token: string,
  id: string
) {
  const res = await request.delete(`${API_BASE}/api/items/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok();
}

export async function reorder(
  request: APIRequestContext,
  token: string,
  orderMap: Record<string, string[]>
) {
  const res = await request.post(`${API_BASE}/api/items/reorder`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { orderMap },
  });
  return await res.json();
}
