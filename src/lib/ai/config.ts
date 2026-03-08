import type { AIEvaluation } from "@/lib/types";

/** Default model and generation settings for all AI providers. */
export const AI_CONFIG = {
  model: "gemini-2.5-flash",
  temperature: 0.3,
  responseMimeType: "application/json",
} as const;

/** Separator between system prompt and candidate answer. */
export const PROMPT_SEPARATOR = "\n---\nAnswer:\n";

/** Max characters for knowledge context injected into evaluation prompt. */
export const MAX_KNOWLEDGE_CHARS = 600;

/** Return a safe fallback evaluation when the AI call or parse fails. */
export function errorFallback(message?: string): AIEvaluation {
  return {
    score: 0,
    feedback: {
      strengths: [],
      weaknesses: [],
      suggestions: [
        message ?? "AI evaluation failed. Please try again.",
      ],
    },
    passed: false,
  };
}
