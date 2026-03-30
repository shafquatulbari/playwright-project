import React, { useState, useEffect } from "react";

const API = "";

export default function History({ onViewRun }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/history`);
      const data = await res.json();
      setHistory(data);
    } catch {
      setHistory([]);
    }
    setLoading(false);
  }

  function formatDate(timestamp) {
    if (!timestamp) return "—";
    const d = new Date(timestamp);
    return d.toLocaleString();
  }

  function openReport(runId) {
    window.open(`${API}/api/report/${runId}`, "_blank");
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h2>History</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Run History</h2>
        <p>{history.length} run{history.length !== 1 ? "s" : ""} recorded</p>
      </div>

      {/* Pass rate trend (simple visual) */}
      {history.length > 1 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <h3>Pass Rate Trend</h3>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 100 }}>
            {history.slice(0, 20).reverse().map((run, i) => {
              const rate = run.passRate || 0;
              const color = rate >= 80 ? "var(--pass)" : rate >= 50 ? "var(--warn)" : "var(--fail)";
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${rate}%`,
                    background: color,
                    borderRadius: "4px 4px 0 0",
                    minWidth: 12,
                    cursor: "pointer",
                    opacity: 0.8,
                    transition: "opacity 0.15s",
                  }}
                  title={`${Math.round(rate)}% pass — ${formatDate(run.timestamp)}`}
                  onClick={() => onViewRun(run.runId)}
                  onMouseEnter={(e) => (e.target.style.opacity = "1")}
                  onMouseLeave={(e) => (e.target.style.opacity = "0.8")}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Older</span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Recent</span>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--text-muted)" }}>No runs recorded yet. Run visual tests to see history.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Browser</th>
                <th>Mode</th>
                <th>Threshold</th>
                <th>Total</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Pass Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((run) => (
                <tr key={run.runId} onClick={() => onViewRun(run.runId)}>
                  <td>{formatDate(run.timestamp)}</td>
                  <td>
                    <span style={{ textTransform: "capitalize" }}>{run.browser || "—"}</span>
                  </td>
                  <td>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      background: run.mode === "ai" || run.mode === "both" ? "rgba(167,139,250,0.2)" : "var(--bg-tertiary)",
                      color: run.mode === "ai" || run.mode === "both" ? "var(--ai-purple)" : "var(--text-secondary)",
                    }}>
                      {run.mode || "pixel"}
                    </span>
                  </td>
                  <td>{run.threshold != null ? `${run.threshold}%` : "—"}</td>
                  <td>{run.total || 0}</td>
                  <td style={{ color: "var(--pass)" }}>{run.passed || 0}</td>
                  <td style={{ color: run.failed > 0 ? "var(--fail)" : "var(--text-secondary)" }}>
                    {run.failed || 0}
                  </td>
                  <td>
                    <span style={{
                      color: (run.passRate || 0) >= 80 ? "var(--pass)" : (run.passRate || 0) >= 50 ? "var(--warn)" : "var(--fail)",
                      fontWeight: 600,
                    }}>
                      {Math.round(run.passRate || 0)}%
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReport(run.runId);
                      }}
                    >
                      HTML Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
