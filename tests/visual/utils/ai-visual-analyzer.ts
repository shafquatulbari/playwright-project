import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";

export interface VisualChange {
  type:
    | "layout-shift"
    | "color-change"
    | "text-change"
    | "element-missing"
    | "element-added"
    | "size-change"
    | "style-change"
    | "no-change";
  severity: "info" | "minor" | "major" | "critical";
  description: string;
}

export interface AIAnalysisResult {
  summary: string;
  changes: VisualChange[];
  overallSeverity: "pass" | "info" | "minor" | "major" | "critical";
  confidence: number;
}

function imageToBase64(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return buffer.toString("base64");
}

export async function analyzeVisualDiff(
  baselinePath: string,
  actualPath: string,
  apiKey?: string
): Promise<AIAnalysisResult> {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return {
      summary:
        "AI analysis unavailable — no ANTHROPIC_API_KEY set. Configure it in Settings to enable AI visual comparison.",
      changes: [],
      overallSeverity: "info",
      confidence: 0,
    };
  }

  const client = new Anthropic({ apiKey: key });

  const baselineB64 = imageToBase64(baselinePath);
  const actualB64 = imageToBase64(actualPath);

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are a visual regression testing AI. Compare these two screenshots of a web application.

Image 1 is the BASELINE (expected state).
Image 2 is the ACTUAL (current state).

Analyze any visual differences between them. Respond ONLY with valid JSON in this exact format:
{
  "summary": "One sentence summary of what changed, or 'No visual differences detected' if identical",
  "changes": [
    {
      "type": "layout-shift|color-change|text-change|element-missing|element-added|size-change|style-change|no-change",
      "severity": "info|minor|major|critical",
      "description": "Specific description of what changed"
    }
  ],
  "overallSeverity": "pass|info|minor|major|critical",
  "confidence": 0.95
}

Severity guide:
- pass: No differences detected
- info: Negligible differences (anti-aliasing, sub-pixel rendering)
- minor: Small visual changes that don't affect usability (slight color shift, font weight)
- major: Noticeable changes that affect appearance (layout shift, missing element, wrong colors)
- critical: Breaking changes (page broken, content missing, major layout collapse)

Be precise and specific about what changed and where on the page.`,
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: baselineB64,
            },
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: actualB64,
            },
          },
        ],
      },
    ],
  });

  try {
    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        summary: "AI analysis failed to produce structured output: " + text,
        changes: [],
        overallSeverity: "info",
        confidence: 0,
      };
    }
    return JSON.parse(jsonMatch[0]) as AIAnalysisResult;
  } catch (e) {
    return {
      summary: "AI analysis failed to parse response",
      changes: [],
      overallSeverity: "info",
      confidence: 0,
    };
  }
}
