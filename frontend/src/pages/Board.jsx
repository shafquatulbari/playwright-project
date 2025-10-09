import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";
import { useAuth } from "../AuthContext.jsx";

const columns = [
  { key: "todo", title: "Todo" },
  { key: "doing", title: "Doing" },
  { key: "done", title: "Done" },
];

export function Board({ onLogout }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [drag, setDrag] = useState({ id: null, from: null });
  const [priority, setPriority] = useState("normal");
  const [highlight, setHighlight] = useState(null);

  const byCol = useMemo(() => {
    const map = { todo: [], doing: [], done: [] };
    for (const it of items) map[it.column]?.push(it);
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.order - b.order);
    return map;
  }, [items]);

  const refresh = async () => {
    const data = await api.list();
    setItems(data);
  };

  useEffect(() => {
    refresh();
  }, []);

  const addItem = async () => {
    if (!title.trim()) return;
    const it = await api.create({
      title: title.trim(),
      column: "todo",
      priority,
    });
    setItems((prev) => [...prev, it]);
    setTitle("");
    setPriority("normal");
  };

  const remove = async (id) => {
    await api.remove(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const saveReorder = async (stateByCol) => {
    const orderMap = Object.fromEntries(
      columns.map((c) => [c.key, stateByCol[c.key].map((x) => x.id)])
    );
    const updated = await api.reorder(orderMap);
    setItems(updated);
  };

  const onDragStart = (e, item, from) => {
    e.dataTransfer.setData("text/plain", item.id);
    setDrag({ id: item.id, from });
  };

  const onDragOver = (e, colKey) => {
    e.preventDefault();
    setHighlight(colKey);
  };

  const onDrop = async (e, toColKey) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;
    const stateByCol = structuredClone(byCol);
    // remove from previous column
    for (const k of Object.keys(stateByCol)) {
      stateByCol[k] = stateByCol[k].filter((x) => x.id !== id);
    }
    // push to new column at end
    const moved = items.find((x) => x.id === id);
    if (!moved) return;
    moved.column = toColKey;
    stateByCol[toColKey].push(moved);
    await saveReorder(stateByCol);
    setDrag({ id: null, from: null });
    setHighlight(null);
  };

  return (
    <div className="container">
      <div className="header">
        <h2>Playwright Demo Board</h2>
        <div className="toolbar">
          <span className="muted">
            Signed in as {user?.name || user?.email || "user"}
          </span>
          <input
            data-testid="new-item-title"
            placeholder="Add a task..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <select
            data-testid="new-item-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          <button data-testid="add-item" onClick={addItem}>
            Add
          </button>
          <button data-testid="refresh" onClick={refresh}>
            Refresh
          </button>
          <button data-testid="logout" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
      <div className="grid">
        {columns.map((col) => (
          <div
            key={col.key}
            className={`col card ${highlight === col.key ? "highlight" : ""}`}
            onDragOver={(e) => onDragOver(e, col.key)}
            onDrop={(e) => onDrop(e, col.key)}
            data-testid={`column-${col.key}`}
          >
            <h3>
              {col.title}{" "}
              <span className="muted">({byCol[col.key].length})</span>
            </h3>
            <div className="column">
              {byCol[col.key].map((it) => (
                <div
                  className="item"
                  key={it.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, it, col.key)}
                  data-testid={`item-${it.id}`}
                >
                  <div className="title">{it.title}</div>
                  <div className="muted">
                    #{it.id.slice(-4)} • status: {it.column} • priority:{" "}
                    {it.priority || "normal"}
                  </div>
                  {it.createdAt && (
                    <div className="muted">
                      created: {new Date(it.createdAt).toLocaleString()}
                    </div>
                  )}
                  {it.updatedAt && (
                    <div className="muted">
                      updated: {new Date(it.updatedAt).toLocaleString()}
                    </div>
                  )}
                  <div className="toolbar" style={{ marginTop: 6 }}>
                    <button
                      data-testid={`delete-${it.id}`}
                      onClick={() => remove(it.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
