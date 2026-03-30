import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const BASELINES_DIR = path.join(ROOT, "visual-baselines");
const RESULTS_DIR = path.join(ROOT, "visual-results");

export function listBaselines() {
  const browsers = ["chromium", "firefox", "webkit"];
  const result = {};

  for (const browser of browsers) {
    const dir = path.join(BASELINES_DIR, browser);
    if (!fs.existsSync(dir)) {
      result[browser] = [];
      continue;
    }
    result[browser] = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".png"))
      .map((f) => {
        const filePath = path.join(dir, f);
        const stat = fs.statSync(filePath);
        return {
          name: f.replace(".png", ""),
          filename: f,
          browser,
          path: `visual-baselines/${browser}/${f}`,
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
        };
      });
  }

  return result;
}

export function acceptBaseline(browser, name, runId) {
  const resultDir = path.join(RESULTS_DIR, runId, "screenshots");
  const baselineDir = path.join(BASELINES_DIR, browser);

  const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const srcPath = path.join(resultDir, `${sanitizedName}.png`);
  const destPath = path.join(baselineDir, `${sanitizedName}.png`);

  if (!fs.existsSync(srcPath)) {
    throw new Error(`Screenshot not found: ${srcPath}`);
  }

  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
  }

  fs.copyFileSync(srcPath, destPath);
  return { success: true, path: destPath };
}

export function deleteBaseline(browser, name) {
  const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filePath = path.join(BASELINES_DIR, browser, `${sanitizedName}.png`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Baseline not found: ${filePath}`);
  }

  fs.unlinkSync(filePath);
  return { success: true };
}

export function updateAllBaselines(runId, browser) {
  const resultDir = path.join(RESULTS_DIR, runId, "screenshots");
  const baselineDir = path.join(BASELINES_DIR, browser);

  if (!fs.existsSync(resultDir)) {
    throw new Error(`Run results not found: ${resultDir}`);
  }

  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
  }

  const files = fs.readdirSync(resultDir).filter((f) => f.endsWith(".png"));
  let updated = 0;

  for (const file of files) {
    fs.copyFileSync(path.join(resultDir, file), path.join(baselineDir, file));
    updated++;
  }

  return { success: true, updated };
}
