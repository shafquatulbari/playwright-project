import { Page, TestInfo } from "@playwright/test";
import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = path.resolve(__dirname, "../../..");
const BASELINES_DIR = path.join(ROOT, "visual-baselines");
const RESULTS_DIR = path.join(ROOT, "visual-results");

export interface CompareResult {
  name: string;
  match: boolean;
  diffPercent: number;
  totalPixels: number;
  diffPixels: number;
  baselinePath: string;
  actualPath: string;
  diffImagePath: string;
  isNewBaseline: boolean;
  timestamp: number;
}

export interface CompareOptions {
  threshold?: number; // 0-1 pixel sensitivity (pixelmatch), default 0.1
  diffThreshold?: number; // percentage threshold for pass/fail, default 0.1
  fullPage?: boolean;
  mask?: { x: number; y: number; width: number; height: number }[];
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function getRunId(): string {
  return process.env.VISUAL_RUN_ID || `run-${Date.now()}`;
}

function getBrowser(): string {
  return process.env.VISUAL_BROWSER || "chromium";
}

export async function captureAndCompare(
  page: Page,
  name: string,
  options: CompareOptions = {}
): Promise<CompareResult> {
  const browser = getBrowser();
  const runId = getRunId();
  const pixelThreshold = options.threshold ?? 0.1;
  const diffThreshold = parseFloat(
    process.env.VISUAL_DIFF_THRESHOLD || String(options.diffThreshold ?? 0.1)
  );

  const baselineDir = path.join(BASELINES_DIR, browser);
  const resultDir = path.join(RESULTS_DIR, runId);
  const screenshotDir = path.join(resultDir, "screenshots");
  const diffDir = path.join(resultDir, "diffs");

  ensureDir(baselineDir);
  ensureDir(screenshotDir);
  ensureDir(diffDir);

  const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const baselinePath = path.join(baselineDir, `${sanitizedName}.png`);
  const actualPath = path.join(screenshotDir, `${sanitizedName}.png`);
  const diffImagePath = path.join(diffDir, `${sanitizedName}-diff.png`);

  // Capture screenshot
  const screenshotBuffer = await page.screenshot({
    fullPage: options.fullPage ?? false,
    animations: "disabled",
  });
  fs.writeFileSync(actualPath, screenshotBuffer);

  // If no baseline exists, create it
  if (!fs.existsSync(baselinePath)) {
    fs.copyFileSync(actualPath, baselinePath);
    return {
      name,
      match: true,
      diffPercent: 0,
      totalPixels: 0,
      diffPixels: 0,
      baselinePath,
      actualPath,
      diffImagePath: "",
      isNewBaseline: true,
      timestamp: Date.now(),
    };
  }

  // Compare images
  const baselineImg = PNG.sync.read(fs.readFileSync(baselinePath));
  const actualImg = PNG.sync.read(fs.readFileSync(actualPath));

  // Handle size differences — resize to match baseline
  const width = Math.max(baselineImg.width, actualImg.width);
  const height = Math.max(baselineImg.height, actualImg.height);

  const resizedBaseline = resizeImage(baselineImg, width, height);
  const resizedActual = resizeImage(actualImg, width, height);

  const diffImg = new PNG({ width, height });
  const diffPixels = pixelmatch(
    resizedBaseline.data,
    resizedActual.data,
    diffImg.data,
    width,
    height,
    { threshold: pixelThreshold }
  );

  fs.writeFileSync(diffImagePath, PNG.sync.write(diffImg));

  const totalPixels = width * height;
  const diffPercent = (diffPixels / totalPixels) * 100;
  const match = diffPercent <= diffThreshold;

  return {
    name,
    match,
    diffPercent: Math.round(diffPercent * 1000) / 1000,
    totalPixels,
    diffPixels,
    baselinePath,
    actualPath,
    diffImagePath,
    isNewBaseline: false,
    timestamp: Date.now(),
  };
}

function resizeImage(img: PNG, width: number, height: number): PNG {
  if (img.width === width && img.height === height) return img;
  const resized = new PNG({ width, height, fill: true });
  // Fill with transparent
  resized.data.fill(0);
  // Copy existing pixels
  for (let y = 0; y < Math.min(img.height, height); y++) {
    for (let x = 0; x < Math.min(img.width, width); x++) {
      const srcIdx = (y * img.width + x) * 4;
      const dstIdx = (y * width + x) * 4;
      resized.data[dstIdx] = img.data[srcIdx];
      resized.data[dstIdx + 1] = img.data[srcIdx + 1];
      resized.data[dstIdx + 2] = img.data[srcIdx + 2];
      resized.data[dstIdx + 3] = img.data[srcIdx + 3];
    }
  }
  return resized;
}

export function saveRunResults(results: CompareResult[]): string {
  const runId = getRunId();
  const resultDir = path.join(RESULTS_DIR, runId);
  const partialsDir = path.join(resultDir, "partials");
  ensureDir(partialsDir);

  const relativeResults = results.map((r) => ({
    ...r,
    baselinePath: path.relative(ROOT, r.baselinePath),
    actualPath: path.relative(ROOT, r.actualPath),
    diffImagePath: r.diffImagePath ? path.relative(ROOT, r.diffImagePath) : "",
  }));

  // Save partial results with unique name (handles parallel workers)
  const partialPath = path.join(partialsDir, `partial-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
  fs.writeFileSync(partialPath, JSON.stringify(relativeResults, null, 2));

  // Merge all partials into final results.json
  mergePartials(runId);
  return path.join(resultDir, "results.json");
}

function mergePartials(runId: string): void {
  const resultDir = path.join(RESULTS_DIR, runId);
  const partialsDir = path.join(resultDir, "partials");

  if (!fs.existsSync(partialsDir)) return;

  const allResults: any[] = [];
  const partialFiles = fs.readdirSync(partialsDir).filter((f: string) => f.endsWith(".json"));

  for (const file of partialFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(partialsDir, file), "utf-8"));
    allResults.push(...data);
  }

  // Deduplicate by name (keep latest)
  const byName = new Map<string, any>();
  for (const r of allResults) {
    byName.set(r.name, r);
  }
  const dedupedResults = Array.from(byName.values());

  const passed = dedupedResults.filter((r: any) => r.match).length;
  const failed = dedupedResults.filter((r: any) => !r.match).length;
  const newBaselines = dedupedResults.filter((r: any) => r.isNewBaseline).length;

  const summary = {
    runId,
    browser: getBrowser(),
    threshold: parseFloat(process.env.VISUAL_DIFF_THRESHOLD || "0.1"),
    mode: process.env.VISUAL_MODE || "pixel",
    timestamp: Date.now(),
    total: dedupedResults.length,
    passed,
    failed,
    newBaselines,
    passRate: dedupedResults.length > 0 ? (passed / dedupedResults.length) * 100 : 0,
    results: dedupedResults,
  };

  fs.writeFileSync(path.join(resultDir, "results.json"), JSON.stringify(summary, null, 2));
}
