import { Page } from "@playwright/test";
import { captureAndCompare, CompareResult, CompareOptions, saveRunResults } from "./comparator";
import { analyzeVisualDiff, AIAnalysisResult } from "./ai-visual-analyzer";

export type VisualMode = "pixel" | "ai" | "both";

export interface VisualTestResult extends CompareResult {
  aiAnalysis?: AIAnalysisResult;
}

const allResults: VisualTestResult[] = [];

function getMode(): VisualMode {
  return (process.env.VISUAL_MODE as VisualMode) || "pixel";
}

export async function visualCompare(
  page: Page,
  name: string,
  options: CompareOptions = {}
): Promise<VisualTestResult> {
  const mode = getMode();

  // Always do pixel comparison
  const pixelResult = await captureAndCompare(page, name, options);
  const result: VisualTestResult = { ...pixelResult };

  // If AI mode is enabled and this is not a new baseline, run AI analysis
  if ((mode === "ai" || mode === "both") && !pixelResult.isNewBaseline) {
    try {
      result.aiAnalysis = await analyzeVisualDiff(
        pixelResult.baselinePath,
        pixelResult.actualPath
      );
    } catch (e: any) {
      result.aiAnalysis = {
        summary: `AI analysis error: ${e.message}`,
        changes: [],
        overallSeverity: "info",
        confidence: 0,
      };
    }
  }

  // In AI-only mode, pass/fail is based on AI severity
  if (mode === "ai" && result.aiAnalysis) {
    const sev = result.aiAnalysis.overallSeverity;
    result.match = sev === "pass" || sev === "info";
  }

  allResults.push(result);
  return result;
}

export function getAllResults(): VisualTestResult[] {
  return [...allResults];
}

export function saveAllResults(): string {
  return saveRunResults(allResults);
}

export function clearResults(): void {
  allResults.length = 0;
}
