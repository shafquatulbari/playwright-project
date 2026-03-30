import React, { useState, useEffect } from "react";
import ImageCompare from "./ImageCompare.jsx";

const API = "";

export default function Results({ selectedRunId, onClearRunId }) {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState({});

  useEffect(() => {
    loadResults();
  }, [selectedRunId]);

  async function loadResults() {
    setLoading(true);
    try {
      const url = selectedRunId
        ? `${API}/api/results/${selectedRunId}`
        : `${API}/api/results`;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
    setLoading(false);
  }

  async function requestAiAnalysis(result) {
    setAiLoading((prev) => ({ ...prev, [result.name]: true }));
    try {
      const res = await fetch(`${API}/api/ai-compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baselinePath: result.baselinePath,
          actualPath: result.actualPath,
        }),
      });
      const analysis = await res.json();
      // Update the result in place
      setData((prev) => ({
        ...prev,
        results: prev.results.map((r) =>
          r.name === result.name ? { ...r, aiAnalysis: analysis } : r
        ),
      }));
    } catch (e) {
      console.error("AI analysis failed:", e);
    }
    setAiLoading((prev) => ({ ...prev, [result.name]: false }));
  }

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h2>Results</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!data || !data.results || data.results.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h2>Results</h2>
          <p>No test results available. Run visual tests first.</p>
        </div>
      </div>
    );
  }

  let filteredResults = [...data.results];
  if (filter === "passed") filteredResults = filteredResults.filter((r) => r.match);
  if (filter === "failed") filteredResults = filteredResults.filter((r) => !r.match);
  if (filter === "new") filteredResults = filteredResults.filter((r) => r.isNewBaseline);

  if (sortBy === "diff") {
    filteredResults.sort((a, b) => b.diffPercent - a.diffPercent);
  } else if (sortBy === "status") {
    filteredResults.sort((a, b) => (a.match === b.match ? 0 : a.match ? 1 : -1));
  }

  return (
    <div>
      <div className="page-header">
        <h2>Test Results</h2>
        <p>
          Run: {data.runId} | Browser: {data.browser} | Threshold: {data.threshold}% | Mode: {data.mode}
          {selectedRunId && (
            <button className="btn btn-sm" style={{ marginLeft: 12 }} onClick={onClearRunId}>
              View Latest
            </button>
          )}
        </p>
      </div>

      {/* Summary stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{data.total}</div>
          <div className="stat-label">Total Tests</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--pass)" }}>{data.passed}</div>
          <div className="stat-label">Passed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--fail)" }}>{data.failed}</div>
          <div className="stat-label">Failed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{Math.round(data.passRate)}%</div>
          <div className="stat-label">Pass Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--info)" }}>{data.newBaselines || 0}</div>
          <div className="stat-label">New Baselines</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <span style={{ fontSize: 13, color: "var(--text-muted)", marginRight: 4 }}>Filter:</span>
        {["all", "passed", "failed", "new"].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: "var(--text-muted)", marginRight: 4 }}>Sort:</span>
        <select className="form-select" style={{ width: "auto" }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="name">Name</option>
          <option value="diff">Diff %</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Result cards */}
      {filteredResults.map((result) => (
        <div key={result.name} className="result-card">
          <div className="result-header">
            <h3>{result.name}</h3>
            <span className={`status-badge ${result.isNewBaseline ? "status-new" : result.match ? "status-pass" : "status-fail"}`}>
              {result.isNewBaseline ? "NEW BASELINE" : result.match ? "PASS" : "FAIL"}
            </span>
            <span className="diff-badge">{result.diffPercent}% diff</span>
            {!result.aiAnalysis && !result.isNewBaseline && (
              <button
                className="btn btn-sm"
                style={{ borderColor: "var(--ai-purple)", color: "var(--ai-purple)" }}
                onClick={() => requestAiAnalysis(result)}
                disabled={aiLoading[result.name]}
              >
                {aiLoading[result.name] ? "Analyzing..." : "AI Analyze"}
              </button>
            )}
          </div>

          {/* Image comparison */}
          {!result.isNewBaseline ? (
            <ImageCompare
              baselineSrc={`/${result.baselinePath}`}
              actualSrc={`/${result.actualPath}`}
              diffSrc={result.diffImagePath ? `/${result.diffImagePath}` : null}
            />
          ) : (
            <div className="images-grid" style={{ gridTemplateColumns: "1fr" }}>
              <div className="image-col">
                <h4>New Baseline Created</h4>
                <img src={`/${result.actualPath}`} alt="New baseline" />
              </div>
            </div>
          )}

          {/* AI Analysis panel */}
          {result.aiAnalysis && (
            <div className="ai-panel">
              <h4>AI Visual Analysis</h4>
              <p className="ai-summary-text">{result.aiAnalysis.summary}</p>
              {result.aiAnalysis.changes && result.aiAnalysis.changes.length > 0 && (
                <div>
                  {result.aiAnalysis.changes.map((change, i) => (
                    <span key={i} className={`change-badge severity-${change.severity}`}>
                      {change.type}: {change.description}
                    </span>
                  ))}
                </div>
              )}
              {result.aiAnalysis.confidence > 0 && (
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                  Confidence: {Math.round(result.aiAnalysis.confidence * 100)}%
                  {" | "}Severity: {result.aiAnalysis.overallSeverity}
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
