"use client";

import type { StudyWeek } from "@/lib/types";

export const QUESTION_TYPE_COLORS: Record<string, string> = {
  SINGLE: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  MULTIPLE: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  ABSTRACT: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  DRAWING: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
};

interface WeekCardProps {
  week: StudyWeek;
  onSelect: (weekId: string) => void;
  isSelected: boolean;
}

export function WeekCard({ week, onSelect, isSelected }: WeekCardProps) {
  const isCompleted = week.isCompleted || week.progress?.completedAt;
  const score = week.progress?.score;
  const questionCount = week.questions.length;
  const topicsList = week.topics.split(",").slice(0, 3);

  const handleClick = () => {
    if (!week.isLocked) {
      onSelect(week.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={week.isLocked}
      className={`w-full text-left p-4 rounded-lg border transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
      } ${isCompleted ? "bg-green-50 dark:bg-green-950" : ""} ${
        week.isLocked ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            {week.isLocked ? (
              <span className="w-5 h-5 rounded-full border-2 border-gray-400 flex items-center justify-center">
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </span>
            ) : isCompleted ? (
              <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white" />
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-gray-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Week {week.weekNumber}</span>
              {week.isLocked && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                  Locked
                </span>
              )}
              {score !== null && score !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  score >= 75 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                }`}>
                  {Math.round(score)}%
                </span>
              )}
            </div>
            <h3 className={`font-semibold ${week.isLocked ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>{week.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{week.description}</p>
            {week.lessonId && (
              <p className="text-xs text-gray-500 mt-1">
                {week.isLocked ? "Complete the lesson first" : "Read the lesson before starting"}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">{questionCount} questions</span>
              <div className="flex flex-wrap gap-1">
                {topicsList.map((topic, i) => (
                  <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {topic.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <span className={`text-gray-400 transition-transform ${isSelected ? "rotate-90" : ""}`}>
          &gt;
        </span>
      </div>
    </button>
  );
}
