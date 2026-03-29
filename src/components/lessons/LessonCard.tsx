"use client";

import type { Lesson } from "@/lib/lessons";

interface LessonCardProps {
  lesson: Lesson;
  resourceCount: number;
  isSelected: boolean;
  isCompleted?: boolean;
  onClick: () => void;
}

export function LessonCard({ lesson, resourceCount, isSelected, isCompleted, onClick }: LessonCardProps) {
  return (
    <button
      onClick={onClick}
      className={"w-full text-left p-4 rounded-lg border transition-all " + (
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="text-2xl">{lesson.icon}</span>
          {isCompleted && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {lesson.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {lesson.description}
          </p>
        </div>
      </div>
      {resourceCount > 0 && (
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {resourceCount} resource{resourceCount !== 1 ? "s" : ""}
        </div>
      )}
    </button>
  );
}
