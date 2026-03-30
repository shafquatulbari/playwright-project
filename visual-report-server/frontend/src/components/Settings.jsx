import React, { useState, useEffect } from "react";

const API = "";

export default function Settings() {
  const [settings, setSettings] = useState({
    defaultBrowser: "chromium",
    defaultThreshold: 0.1,
    defaultMode: "pixel",
    anthropicApiKey: "",
    hasApiKey: false,
    autoAcceptBaselines: true,
    screenshotWidth: 1280,
    screenshotHeight: 720,
    retentionDays: 30,
  });
  const [saved, setSaved] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");

  useEffect(() => {
    fetch(`${API}/api/settings`)
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setApiKeyInput(data.anthropicApiKey || "");
      })
      .catch(() => {});
  }, []);

  async function save() {
    const payload = { ...settings };
    // Send the API key from input
    if (apiKeyInput && !apiKeyInput.startsWith("...")) {
      payload.anthropicApiKey = apiKeyInput;
    }
    delete payload.hasApiKey;

    await fetch(`${API}/api/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Configure default values for visual testing</p>
      </div>

      <div className="settings-grid">
        {/* Left column */}
        <div className="card">
          <div className="card-header">
            <h3>Test Defaults</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Default Browser</label>
            <select
              className="form-select"
              value={settings.defaultBrowser}
              onChange={(e) => setSettings({ ...settings, defaultBrowser: e.target.value })}
            >
              <option value="chromium">Chromium</option>
              <option value="firefox">Firefox</option>
              <option value="webkit">WebKit (Safari)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Default Diff Threshold</label>
            <div className="range-container">
              <input
                type="range"
                className="range-slider"
                min="0"
                max="10"
                step="0.05"
                value={settings.defaultThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, defaultThreshold: parseFloat(e.target.value) })
                }
              />
              <span className="range-value">{settings.defaultThreshold.toFixed(2)}%</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Default Comparison Mode</label>
            <div className="mode-selector">
              {["pixel", "ai", "both"].map((m) => (
                <button
                  key={m}
                  className={`mode-option ${settings.defaultMode === m ? "active" : ""}`}
                  onClick={() => setSettings({ ...settings, defaultMode: m })}
                >
                  {m === "pixel" ? "Pixel" : m === "ai" ? "AI Smart" : "Both"}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <div className="toggle-container">
              <button
                className={`toggle ${settings.autoAcceptBaselines ? "active" : ""}`}
                onClick={() =>
                  setSettings({ ...settings, autoAcceptBaselines: !settings.autoAcceptBaselines })
                }
              />
              <span style={{ fontSize: 14 }}>Auto-accept baselines on first run</span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="card">
          <div className="card-header">
            <h3>AI & Advanced</h3>
          </div>

          <div className="form-group">
            <label className="form-label">Anthropic API Key</label>
            <input
              type="password"
              className="form-input"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-ant-..."
            />
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              Required for AI Smart Compare mode. {settings.hasApiKey ? "Key is set." : "No key configured."}
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Screenshot Width</label>
            <input
              type="number"
              className="form-input"
              value={settings.screenshotWidth}
              onChange={(e) =>
                setSettings({ ...settings, screenshotWidth: parseInt(e.target.value) || 1280 })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Screenshot Height</label>
            <input
              type="number"
              className="form-input"
              value={settings.screenshotHeight}
              onChange={(e) =>
                setSettings({ ...settings, screenshotHeight: parseInt(e.target.value) || 720 })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Results Retention (days)</label>
            <input
              type="number"
              className="form-input"
              value={settings.retentionDays}
              onChange={(e) =>
                setSettings({ ...settings, retentionDays: parseInt(e.target.value) || 30 })
              }
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 12, alignItems: "center" }}>
        <button className="btn btn-primary" onClick={save} style={{ padding: "10px 24px" }}>
          Save Settings
        </button>
        {saved && <span style={{ color: "var(--pass)", fontSize: 14 }}>Settings saved!</span>}
      </div>
    </div>
  );
}
