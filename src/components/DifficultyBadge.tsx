import { Difficulty } from "@/lib/types";

const styles: Record<Difficulty, string> = {
  EASY: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  MEDIUM:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  HARD: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const d = difficulty as Difficulty;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[d] ?? ""}`}
    >
      {d}
    </span>
  );
}
