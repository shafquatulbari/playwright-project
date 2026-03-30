import React, { useState, useEffect, useRef } from "react";

const API = "";

export default function RunTests() {
  const [tests, setTests] = useState([]);
  const [browser, setBrowser] = useState("chromium");
  const [threshold, setThreshold] = useState(0.1);
  const [mode, setMode] = useState("pixel");
  const [headed, setHeaded] = useState(false);
  const [selectedTests, setSelectedTests] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState("");
  const [runId, setRunId] = useState(null);
  const [isDone, setIsDone] = useState(false);
  const consoleRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/tests`)
      .then((r) => r.json())
      .then(setTests)
      .catch(() => {});

    fetch(`${API}/api/settings`)
      .then((r) => r.json())
      .then((s) => {
        if (s.defaultBrowser) setBrowser(s.defaultBrowser);
        if (s.defaultThreshold) setThreshold(s.defaultThreshold);
        if (s.defaultMode) setMode(s.defaultMode);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const evtSource = new EventSource(`${API}/api/run/stream`);
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "stdout" || data.type === "stderr") {
        setOutput((prev) => prev + data.text);
      }
      if (data.type === "done") {
        setIsRunning(false);
        setIsDone(true);
        evtSource.close();
      }
    };
    evtSource.onerror = () => {
      evtSource.close();
    };

    return () => evtSource.close();
  }, [isRunning]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output]);

  function toggleTest(filename) {
    setSelectedTests((prev) =>
      prev.includes(filename)
        ? prev.filter((f) => f !== filename)
        : [...prev, filename]
    );
  }

  async function startRun() {
    setOutput("");
    setIsRunning(true);
    setIsDone(false);

    const res = await fetch(`${API}/api/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        browser,
        threshold,
        mode,
        headed,
        tests: selectedTests,
      }),
    });
    const data = await res.json();
    setRunId(data.runId);
  }

  return (
    <div>
      <div className="page-header">
        <h2>Run Visual Tests</h2>
        <p>Configure and execute visual regression tests</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Left column: Config */}
        <div className="card">
          <div className="card-header">
            <h3>Configuration</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Browser</label>
            <select className="form-select" value={browser} onChange={(e) => setBrowser(e.target.value)}>
              <option value="chromium">Chromium</option>
              <option value="firefox">Firefox</option>
              <option value="webkit">WebKit (Safari)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Diff Threshold</label>
            <div className="range-container">
              <input
                type="range"
                className="range-slider"
                min="0"
                max="10"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
              />
              <span className="range-value">{threshold.toFixed(2)}%</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Comparison Mode</label>
            <div className="mode-selector">
              {["pixel", "ai", "both"].map((m) => (
                <button
                  key={m}
                  className={`mode-option ${mode === m ? "active" : ""}`}
                  onClick={() => setMode(m)}
                >
                  {m === "pixel" ? "Pixel-by-Pixel" : m === "ai" ? "AI Smart" : "Both"}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-container">
              <button
                className={`toggle ${headed ? "active" : ""}`}
                onClick={() => setHeaded(!headed)}
              />
              <span style={{ fontSize: 14 }}>Headed Mode</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "12px", fontSize: 15, fontWeight: 600 }}
            onClick={startRun}
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "Run Tests"}
          </button>
        </div>

        {/* Right column: Test selection */}
        <div className="card">
          <div className="card-header">
            <h3>Test Files</h3>
            <button
              className="btn btn-sm"
              onClick={() =>
                setSelectedTests(
                  selectedTests.length === tests.length
                    ? []
                    : tests.map((t) => t.filename)
                )
              }
            >
              {selectedTests.length === tests.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="test-list">
            {tests.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
                No visual test files found. They will appear in tests/visual/
              </p>
            )}
            {tests.map((t) => (
              <label key={t.filename} className="test-item">
                <input
                  type="checkbox"
                  className="test-checkbox"
                  checked={selectedTests.includes(t.filename)}
                  onChange={() => toggleTest(t.filename)}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.filename}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Console Output */}
      {(output || isRunning) && (
        <div className="card">
          <div className="card-header">
            <h3>
              {isRunning ? "Running..." : isDone ? "Complete" : "Output"}
            </h3>
            {runId && (
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Run ID: {runId}
              </span>
            )}
          </div>

          {isRunning && (
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "100%", animation: "pulse 1.5s ease-in-out infinite" }} />
            </div>
          )}

          <div className="console" ref={consoleRef}>
            {output.split("\n").map((line, i) => (
              <div
                key={i}
                className={`console-line ${
                  line.includes("FAIL") || line.includes("Error")
                    ? "error"
                    : line.includes("PASS") || line.includes("passed")
                    ? "success"
                    : ""
                }`}
              >
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
