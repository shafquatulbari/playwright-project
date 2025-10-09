const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

export function getToken() {
  return localStorage.getItem("token");
}

export function setToken(t) {
  if (!t) localStorage.removeItem("token");
  else localStorage.setItem("token", t);
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    let msg = "Request failed";
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (data) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  login: (data) =>
    request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  list: () => request("/api/items"),
  create: (data) =>
    request("/api/items", { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/api/items/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => request(`/api/items/${id}`, { method: "DELETE" }),
  reorder: (orderMap) =>
    request("/api/items/reorder", {
      method: "POST",
      body: JSON.stringify({ orderMap }),
    }),
};
