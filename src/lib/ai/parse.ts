import type { AIEvaluation } from "@/lib/types";
import { errorFallback } from "./config";

/**
 * Parse an AI response string into a validated AIEvaluation.
 * Handles raw JSON, markdown-fenced JSON, and malformed responses.
 */
export function parseAIResponse(text: string): AIEvaluation {
  // Try raw JSON first
  const parsed = tryParseJSON(text);
  if (parsed) return validateEvaluation(parsed);

  // Try extracting JSON from markdown code blocks
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) {
    const inner = tryParseJSON(fenced[1].trim());
    if (inner) return validateEvaluation(inner);
  }

  return errorFallback("Could not parse AI response.");
}

function tryParseJSON(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function validateEvaluation(data: Record<string, unknown>): AIEvaluation {
  const score = Math.max(0, Math.min(100, Number(data.score) || 0));
  const feedback = data.feedback as Record<string, unknown> | undefined;

  return {
    score,
    feedback: {
      strengths: toStringArray(feedback?.strengths),
      weaknesses: toStringArray(feedback?.weaknesses),
      suggestions: toStringArray(feedback?.suggestions),
    },
    passed: typeof data.passed === "boolean" ? data.passed : score >= 60,
  };
}

function toStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  return [];
}
