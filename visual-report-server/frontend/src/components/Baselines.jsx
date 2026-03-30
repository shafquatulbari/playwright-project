import React, { useState, useEffect } from "react";

const API = "";

export default function Baselines() {
  const [baselines, setBaselines] = useState({});
  const [activeBrowser, setActiveBrowser] = useState("chromium");
  const [modalImage, setModalImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBaselines();
  }, []);

  async function loadBaselines() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/baselines`);
      const data = await res.json();
      setBaselines(data);
    } catch {
      setBaselines({});
    }
    setLoading(false);
  }

  async function updateAllBaselines() {
    try {
      const res = await fetch(`${API}/api/results`);
      const data = await res.json();
      if (!data.runId) {
        alert("No recent run found to update baselines from");
        return;
      }
      await fetch(`${API}/api/baselines/update-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: data.runId, browser: activeBrowser }),
      });
      loadBaselines();
    } catch (e) {
      alert("Failed to update baselines: " + e.message);
    }
  }

  const browsers = ["chromium", "firefox", "webkit"];
  const activeBaselines = baselines[activeBrowser] || [];

  return (
    <div>
      <div className="page-header">
        <h2>Baselines</h2>
        <p>Manage baseline screenshots for visual comparison</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        {browsers.map((b) => (
          <button
            key={b}
            className={`filter-btn ${activeBrowser === b ? "active" : ""}`}
            onClick={() => setActiveBrowser(b)}
          >
            {b.charAt(0).toUpperCase() + b.slice(1)}
            {baselines[b] ? ` (${baselines[b].length})` : " (0)"}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn btn-success btn-sm" onClick={updateAllBaselines}>
          Update All from Latest Run
        </button>
        <button className="btn btn-sm" onClick={loadBaselines}>
          Refresh
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)" }}>Loading baselines...</p>
      ) : activeBaselines.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            No baselines for {activeBrowser}. Run visual tests to create baselines.
          </p>
        </div>
      ) : (
        <div className="baselines-grid">
          {activeBaselines.map((b) => (
            <div key={b.name} className="baseline-card" onClick={() => setModalImage(`/${b.path}`)}>
              <img src={`/${b.path}`} alt={b.name} />
              <div className="baseline-info">
                <h4>{b.name}</h4>
                <p>
                  {(b.size / 1024).toFixed(1)} KB | {new Date(b.lastModified).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalImage && (
        <div className="modal-overlay" onClick={() => setModalImage(null)}>
          <div className="modal-content">
            <img src={modalImage} alt="Full size baseline" />
          </div>
        </div>
      )}
    </div>
  );
}
