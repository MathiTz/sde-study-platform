export function evaluateAnswer(
  questionOptions: string | null,
  userAnswer: string,
  type: "SINGLE" | "MULTIPLE" | "ABSTRACT" | "DRAWING"
): { isCorrect: boolean; score: number } | null {
  if (type === "SINGLE" || type === "MULTIPLE") {
    const correctOptions = JSON.parse(questionOptions || "[]")
      .filter((o: { isCorrect: boolean }) => o.isCorrect)
      .map((o: { text: string }) => o.text);

    const selectedOptions = JSON.parse(userAnswer);
    const correctSet = new Set(correctOptions);
    const selectedSet = new Set(selectedOptions);

    const isCorrect =
      correctSet.size === selectedSet.size &&
      [...correctSet].every((o) => selectedSet.has(o));

    return { isCorrect, score: isCorrect ? 100 : 0 };
  }

  return null;
}

export function parseAnswerOptions(options: string | null): { text: string; isCorrect: boolean }[] {
  if (!options) return [];
  try {
    return JSON.parse(options);
  } catch {
    return [];
  }
}

export function serializeAnswer(answer: string[]): string {
  return JSON.stringify(answer);
}

export function getWeekScoreStats(
  attempts: { isCorrect: boolean | null; score: number | null }[]
): { correctCount: number; total: number; avgScore: number | null } {
  const scored = attempts.filter((a) => a.score !== null);
  const correctCount = scored.filter((a) => a.isCorrect).length;
  const total = scored.length;
  const avgScore =
    total > 0
      ? scored.reduce((sum, a) => sum + (a.score || 0), 0) / total
      : null;

  return { correctCount, total, avgScore };
}

export function isWeekComplete(
  totalQuestions: number,
  attemptsCount: number
): boolean {
  return attemptsCount >= totalQuestions;
}

export const STUDY_PLAN_SYSTEM_PROMPT = `You are evaluating a System Design interview study question response. 
Evaluate the quality of the response based on:
1. Understanding of core concepts
2. Technical accuracy
3. Completeness
4. Clear communication

Provide a score from 0-100 and structured feedback with:
- strengths: What was done well
- weaknesses: What could be improved
- suggestions: Specific recommendations

Passing threshold is 60%.`;

export function buildUserPrompt(
  question: string,
  topic: string,
  userAnswer: string,
  type: "ABSTRACT" | "DRAWING"
): string {
  const contentType = type === "ABSTRACT" ? "User's Answer" : "User's Diagram/Explanation";
  return `Question: ${question}\n\nTopic: ${topic}\n\n${contentType}:\n${userAnswer}`;
}
