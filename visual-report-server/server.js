import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { listBaselines, acceptBaseline, updateAllBaselines } from "./lib/baseline-manager.js";
import { getRunResults, getLatestResults, getHistory, generateHtmlReport } from "./lib/report-generator.js";
import { compareImages } from "./lib/screenshot-comparator.js";
import { aiCompareImages } from "./lib/ai-comparator.js";

const app = express();
const PORT = 4500;
const ROOT = path.resolve(import.meta.dirname, "..");

app.use(cors());
app.use(express.json());

// Serve static files (screenshots, baselines, diffs)
app.use("/visual-baselines", express.static(path.join(ROOT, "visual-baselines")));
app.use("/visual-results", express.static(path.join(ROOT, "visual-results")));

// Serve frontend build
const frontendDist = path.join(import.meta.dirname, "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
}

// Settings storage
const SETTINGS_FILE = path.join(import.meta.dirname, "settings.json");

function loadSettings() {
  if (fs.existsSync(SETTINGS_FILE)) {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
  }
  return {
    defaultBrowser: "chromium",
    defaultThreshold: 0.1,
    defaultMode: "pixel",
    anthropicApiKey: "",
    autoAcceptBaselines: true,
    screenshotWidth: 1280,
    screenshotHeight: 720,
    retentionDays: 30,
  };
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// Track active SSE connections for streaming test output
let activeStreams = [];

// ==================== API ROUTES ====================

// List visual test files
app.get("/api/tests", (req, res) => {
  const testDir = path.join(ROOT, "tests", "visual");
  if (!fs.existsSync(testDir)) return res.json([]);

  const files = fs
    .readdirSync(testDir)
    .filter((f) => f.endsWith(".spec.ts"))
    .map((f) => ({
      name: f.replace(".spec.ts", ""),
      filename: f,
      path: `tests/visual/${f}`,
    }));

  res.json(files);
});

// Get latest results
app.get("/api/results", (req, res) => {
  const results = getLatestResults();
  res.json(results || { total: 0, passed: 0, failed: 0, results: [] });
});

// Get specific run results
app.get("/api/results/:runId", (req, res) => {
  const results = getRunResults(req.params.runId);
  if (!results) return res.status(404).json({ error: "Run not found" });
  res.json(results);
});

// List baselines
app.get("/api/baselines", (req, res) => {
  res.json(listBaselines());
});

// Accept a baseline
app.post("/api/baselines/accept", (req, res) => {
  try {
    const { browser, name, runId } = req.body;
    const result = acceptBaseline(browser, name, runId);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update all baselines from a run
app.post("/api/baselines/update-all", (req, res) => {
  try {
    const { runId, browser } = req.body;
    const result = updateAllBaselines(runId, browser);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Run tests
app.post("/api/run", (req, res) => {
  const { browser = "chromium", threshold = 0.1, mode = "pixel", tests = [], headed = false } = req.body;
  const runId = `run-${Date.now()}`;

  const env = {
    ...process.env,
    VISUAL_RUN_ID: runId,
    VISUAL_BROWSER: browser,
    VISUAL_DIFF_THRESHOLD: String(threshold),
    VISUAL_MODE: mode,
  };

  // --config must come first, then --project, then options, then file paths last
  const args = ["playwright", "test", "--config", "playwright.visual.config.ts", "--project", browser];

  // Playwright is headless by default; only add --headed when user wants headed mode
  if (headed) args.push("--headed");

  // Test file paths must come after all flags
  if (tests.length > 0) {
    for (const t of tests) {
      args.push(path.join("tests", "visual", t));
    }
  } else {
    args.push("tests/visual/");
  }

  const child = spawn("npx", args, {
    cwd: ROOT,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });

  let output = "";
  let isRunning = true;

  child.stdout.on("data", (data) => {
    const text = data.toString();
    output += text;
    activeStreams.forEach((stream) => {
      stream.write(`data: ${JSON.stringify({ type: "stdout", text, runId })}\n\n`);
    });
  });

  child.stderr.on("data", (data) => {
    const text = data.toString();
    output += text;
    activeStreams.forEach((stream) => {
      stream.write(`data: ${JSON.stringify({ type: "stderr", text, runId })}\n\n`);
    });
  });

  child.on("close", (code) => {
    isRunning = false;
    activeStreams.forEach((stream) => {
      stream.write(
        `data: ${JSON.stringify({ type: "done", code, runId })}\n\n`
      );
    });
  });

  res.json({ runId, status: "started" });
});

// SSE stream for test output
app.get("/api/run/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  activeStreams.push(res);

  req.on("close", () => {
    activeStreams = activeStreams.filter((s) => s !== res);
  });
});

// Get run history
app.get("/api/history", (req, res) => {
  res.json(getHistory());
});

// Generate HTML report
app.get("/api/report/:runId?", (req, res) => {
  const html = generateHtmlReport(req.params.runId);
  res.type("html").send(html);
});

// AI compare two specific images (for on-demand comparison from dashboard)
app.post("/api/ai-compare", async (req, res) => {
  try {
    const { baselinePath, actualPath } = req.body;
    const settings = loadSettings();
    const baseFull = path.join(ROOT, baselinePath);
    const actualFull = path.join(ROOT, actualPath);

    if (!fs.existsSync(baseFull) || !fs.existsSync(actualFull)) {
      return res.status(404).json({ error: "Image not found" });
    }

    const result = await aiCompareImages(baseFull, actualFull, settings.anthropicApiKey);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Settings
app.get("/api/settings", (req, res) => {
  const settings = loadSettings();
  // Don't expose full API key
  res.json({
    ...settings,
    anthropicApiKey: settings.anthropicApiKey
      ? `...${settings.anthropicApiKey.slice(-8)}`
      : "",
    hasApiKey: !!settings.anthropicApiKey,
  });
});

app.post("/api/settings", (req, res) => {
  const current = loadSettings();
  const updated = { ...current, ...req.body };
  // If API key is masked, keep old one
  if (req.body.anthropicApiKey && req.body.anthropicApiKey.startsWith("...")) {
    updated.anthropicApiKey = current.anthropicApiKey;
  }
  saveSettings(updated);
  res.json({ success: true });
});

// Catch-all: serve frontend
app.get("*", (req, res) => {
  const indexPath = path.join(frontendDist, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Frontend not built. Run: cd visual-report-server/frontend && npm run build");
  }
});

app.listen(PORT, () => {
  console.log(`Visual Testing Dashboard running at http://localhost:${PORT}`);
});
