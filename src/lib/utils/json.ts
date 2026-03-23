import type { AIEvaluation } from "@/lib/types";

/** Parse JSON safely, returning a fallback value on failure. */
export function safeParseJSON<T>(
  json: string | null | undefined,
  fallback: T
): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/** Parse an AI evaluation JSON string, returning null on failure. */
export function safeParseEvaluation(
  json: string | null | undefined
): AIEvaluation | null {
  return safeParseJSON<AIEvaluation | null>(json ?? null, null);
}
