import type { QuestionType } from "@/lib/types";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  SINGLE: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  MULTIPLE: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  ABSTRACT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  DRAWING: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

export const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  INTERMEDIATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ADVANCED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};
