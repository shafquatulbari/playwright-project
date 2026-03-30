import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const RESULTS_DIR = path.join(ROOT, "visual-results");

export function getRunIds() {
  if (!fs.existsSync(RESULTS_DIR)) return [];
  const dirs = fs
    .readdirSync(RESULTS_DIR)
    .filter((d) => {
      const resultsFile = path.join(RESULTS_DIR, d, "results.json");
      return fs.existsSync(resultsFile);
    });

  // Sort by timestamp inside results.json (most recent first)
  dirs.sort((a, b) => {
    try {
      const aData = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, a, "results.json"), "utf-8"));
      const bData = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, b, "results.json"), "utf-8"));
      return (bData.timestamp || 0) - (aData.timestamp || 0);
    } catch {
      return 0;
    }
  });

  return dirs;
}

export function getRunResults(runId) {
  const resultsFile = path.join(RESULTS_DIR, runId, "results.json");
  if (!fs.existsSync(resultsFile)) return null;
  return JSON.parse(fs.readFileSync(resultsFile, "utf-8"));
}

export function getLatestResults() {
  const runs = getRunIds();
  if (runs.length === 0) return null;
  return getRunResults(runs[0]);
}

export function getHistory() {
  const runs = getRunIds();
  return runs.map((runId) => {
    const data = getRunResults(runId);
    if (!data) return { runId, error: "No data" };
    return {
      runId,
      browser: data.browser,
      threshold: data.threshold,
      mode: data.mode,
      timestamp: data.timestamp,
      total: data.total,
      passed: data.passed,
      failed: data.failed,
      passRate: data.passRate,
    };
  });
}

export function generateHtmlReport(runId) {
  const data = runId ? getRunResults(runId) : getLatestResults();
  if (!data) return "<html><body><h1>No results found</h1></body></html>";

  const passColor = "#22c55e";
  const failColor = "#ef4444";
  const warnColor = "#f59e0b";

  const resultCards = data.results
    .map((r) => {
      const statusColor = r.match ? passColor : failColor;
      const statusText = r.isNewBaseline ? "NEW BASELINE" : r.match ? "PASS" : "FAIL";
      const aiSection = r.aiAnalysis
        ? `<div class="ai-summary">
            <h4>AI Analysis</h4>
            <p>${r.aiAnalysis.summary}</p>
            ${r.aiAnalysis.changes
              .map(
                (c) =>
                  `<span class="change-badge severity-${c.severity}">${c.type}: ${c.description}</span>`
              )
              .join("")}
          </div>`
        : "";

      return `
      <div class="result-card">
        <div class="result-header">
          <h3>${r.name}</h3>
          <span class="status-badge" style="background:${statusColor}">${statusText}</span>
          <span class="diff-badge">${r.diffPercent}% diff</span>
        </div>
        <div class="images-row">
          <div class="image-col">
            <h4>Baseline</h4>
            <img src="${r.baselinePath}" alt="Baseline" />
          </div>
          <div class="image-col">
            <h4>Actual</h4>
            <img src="${r.actualPath}" alt="Actual" />
          </div>
          ${
            r.diffImagePath
              ? `<div class="image-col">
                  <h4>Diff</h4>
                  <img src="${r.diffImagePath}" alt="Diff" />
                </div>`
              : ""
          }
        </div>
        ${aiSection}
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Visual Test Report - ${data.runId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0b0b0c; color: #e8e8ea; padding: 24px; }
    .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .summary-card { background: #16171a; border: 1px solid #2a2b2f; border-radius: 10px; padding: 20px; min-width: 150px; text-align: center; }
    .summary-card h2 { font-size: 32px; margin-bottom: 4px; }
    .summary-card p { opacity: 0.7; font-size: 14px; }
    .result-card { background: #16171a; border: 1px solid #2a2b2f; border-radius: 10px; padding: 20px; margin-bottom: 16px; }
    .result-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .result-header h3 { flex: 1; }
    .status-badge { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; color: white; }
    .diff-badge { padding: 4px 12px; border-radius: 6px; font-size: 12px; background: #2a2b2f; }
    .images-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 12px; }
    .image-col h4 { margin-bottom: 8px; font-size: 13px; opacity: 0.7; }
    .image-col img { width: 100%; border-radius: 8px; border: 1px solid #34363c; }
    .ai-summary { margin-top: 16px; padding: 12px; background: #1b1c20; border-radius: 8px; }
    .ai-summary h4 { margin-bottom: 8px; color: #a78bfa; }
    .change-badge { display: inline-block; padding: 2px 8px; margin: 2px; border-radius: 4px; font-size: 12px; }
    .severity-info { background: #1e3a5f; }
    .severity-minor { background: #5f4b1e; }
    .severity-major { background: #5f2e1e; }
    .severity-critical { background: #7f1d1d; }
    h1 { margin-bottom: 8px; }
    .subtitle { opacity: 0.6; margin-bottom: 24px; }
  </style>
</head>
<body>
  <h1>Visual Test Report</h1>
  <p class="subtitle">Run: ${data.runId} | Browser: ${data.browser} | Threshold: ${data.threshold}% | Mode: ${data.mode}</p>

  <div class="summary">
    <div class="summary-card"><h2>${data.total}</h2><p>Total Tests</p></div>
    <div class="summary-card"><h2 style="color:${passColor}">${data.passed}</h2><p>Passed</p></div>
    <div class="summary-card"><h2 style="color:${failColor}">${data.failed}</h2><p>Failed</p></div>
    <div class="summary-card"><h2>${Math.round(data.passRate)}%</h2><p>Pass Rate</p></div>
    <div class="summary-card"><h2>${data.newBaselines || 0}</h2><p>New Baselines</p></div>
  </div>

  ${resultCards}
</body>
</html>`;
}
