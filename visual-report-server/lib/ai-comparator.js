import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";

export async function aiCompareImages(baselinePath, actualPath, apiKey) {
  if (!apiKey) {
    return {
      summary: "AI analysis unavailable — no API key configured",
      changes: [],
      overallSeverity: "info",
      confidence: 0,
    };
  }

  const client = new Anthropic({ apiKey });

  const baselineB64 = fs.readFileSync(baselinePath).toString("base64");
  const actualB64 = fs.readFileSync(actualPath).toString("base64");

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
- minor: Small visual changes that don't affect usability
- major: Noticeable changes that affect appearance
- critical: Breaking changes (page broken, content missing, major layout collapse)

Be precise and specific.`,
          },
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: baselineB64 },
          },
          {
            type: "image",
            source: { type: "base64", media_type: "image/png", data: actualB64 },
          },
        ],
      },
    ],
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { summary: "AI analysis failed to produce structured output", changes: [], overallSeverity: "info", confidence: 0 };
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { summary: "AI analysis failed to parse response", changes: [], overallSeverity: "info", confidence: 0 };
  }
}
