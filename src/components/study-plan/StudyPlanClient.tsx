"use client";

import { useState, useEffect } from "react";
import { WeekCard } from "./WeekCard";
import { QuestionCard } from "./QuestionCard";
import type { StudyPlan, StudyWeek, StudyQuestion } from "@/lib/types";
import { WEEK_PASSING_SCORE_THRESHOLD } from "@/lib/types";

interface UserProgress {
  weekId: string;
  score: number | null;
  completedAt: Date | null;
  attemptsCount: number;
}

interface StudyPlanClientProps {
  initialPlan: StudyPlan | null;
  userProgress: UserProgress[];
}

export function StudyPlanClient({
  initialPlan,
  userProgress,
}: StudyPlanClientProps) {
  const plan = initialPlan;
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [weekScore, setWeekScore] = useState<{
    correct: number;
    total: number;
    avgScore: number | null;
  } | null>(null);
  const [showLockMessage, setShowLockMessage] = useState(false);

  const progressMap = new Map(userProgress.map((p) => [p.weekId, p]));

  useEffect(() => {
    if (!plan) return;
    
    const savedWeekId = localStorage.getItem("study-plan-current-week");
    if (savedWeekId) {
      const week = plan.weeks.find((w) => w.id === savedWeekId);
      if (week && !week.isLocked) {
        setSelectedWeekId(savedWeekId);
        return;
      }
    }
    
    const firstAccessibleWeek = plan.weeks.find((w) => !w.isLocked && !w.isCompleted);
    if (firstAccessibleWeek) {
      setSelectedWeekId(firstAccessibleWeek.id);
    } else if (plan.weeks.length > 0) {
      const firstUnlocked = plan.weeks.find((w) => !w.isLocked);
      if (firstUnlocked) {
        setSelectedWeekId(firstUnlocked.id);
      }
    }
  }, [plan]);

  useEffect(() => {
    if (!selectedWeekId) return;
    
    localStorage.setItem("study-plan-current-week", selectedWeekId);

    async function loadQuestions() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/study-plan/questions?weekId=${selectedWeekId}`
        );
        const data = await res.json();
        setQuestions(data.questions || []);

        if (data.correctCount !== undefined) {
          setWeekScore({
            correct: data.correctCount,
            total: data.totalQuestions,
            avgScore: data.weekScore,
          });
        }
      } catch (error) {
        console.error("Failed to load questions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadQuestions();
  }, [selectedWeekId]);

  const handleWeekSelect = (weekId: string) => {
    const week = plan?.weeks.find((w) => w.id === weekId);
    if (week?.isLocked) {
      setShowLockMessage(true);
      setTimeout(() => setShowLockMessage(false), 3000);
      return;
    }
    setSelectedWeekId(weekId);
    setQuestions([]);
    setWeekScore(null);
  };

  const handleSubmitAnswer = async (
    questionId: string,
    answer: string,
    type: string
  ) => {
    const res = await fetch("/api/study-plan/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, userAnswer: answer, type }),
    });

    const data = await res.json();

    if (data.error) {
      return { error: data.error };
    }

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              attempts: [
                {
                  ...data.attempt,
                  createdAt: new Date().toISOString(),
                },
                ...q.attempts,
              ],
            }
          : q
      )
    );

    if (data.correctCount !== undefined) {
      setWeekScore({
        correct: data.correctCount,
        total: data.totalQuestions,
        avgScore: data.weekScore,
      });
    }

    return data;
  };

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No study plan available.</p>
      </div>
    );
  }

  const selectedWeek = plan.weeks.find((w) => w.id === selectedWeekId);
  const weeksWithProgress: StudyWeek[] = plan.weeks.map((week) => ({
    ...week,
    progress: progressMap.get(week.id)
      ? {
          id: week.id,
          startedAt: new Date().toISOString(),
          completedAt: progressMap.get(week.id)?.completedAt?.toISOString() ?? null,
          score: progressMap.get(week.id)?.score ?? null,
          attemptsCount: progressMap.get(week.id)?.attemptsCount ?? 0,
        }
      : null,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {showLockMessage && (
        <div className="fixed top-4 right-4 z-50 bg-yellow-100 dark:bg-yellow-900 border border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Complete the previous week with 75% score to unlock this week</span>
          </div>
        </div>
      )}
      
      <div className="lg:col-span-1 space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {plan.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {plan.description}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
            Pass each week with {WEEK_PASSING_SCORE_THRESHOLD}% to unlock the next
          </p>
        </div>

        <div className="space-y-3">
          {weeksWithProgress.map((week) => (
            <WeekCard
              key={week.id}
              week={week}
              onSelect={handleWeekSelect}
              isSelected={week.id === selectedWeekId}
            />
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedWeek && selectedWeek.isLocked ? (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Week Locked
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Complete the previous week with at least {WEEK_PASSING_SCORE_THRESHOLD}% score to unlock this week.
            </p>
            {selectedWeek.lessonId && (
              <p className="text-sm text-gray-500 mt-2">
                You also need to read the related lesson before starting.
              </p>
            )}
          </div>
        ) : selectedWeek ? (
          <div className="space-y-6">
            <WeekHeader week={selectedWeek} weekScore={weekScore} />

            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  No questions available for this week.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((question, idx) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    questionNumber={idx + 1}
                    totalQuestions={questions.length}
                    onSubmit={handleSubmitAnswer}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function WeekHeader({
  week,
  weekScore,
}: {
  week: StudyWeek;
  weekScore: { correct: number; total: number; avgScore: number | null } | null;
}) {
  const topicsList = week.topics.split(",");

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Week {week.weekNumber}: {week.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {week.description}
          </p>
        </div>
        {weekScore && weekScore.avgScore !== null && (
          <div className="shrink-0">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${
              weekScore.avgScore >= 75 
                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
            }`}>
              Avg: {Math.round(weekScore.avgScore)}%
            </span>
          </div>
        )}
      </div>

      {weekScore && (
        <div className="mt-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{
                  width: `${(weekScore.correct / weekScore.total) * 100}%`,
                }}
              />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {weekScore.correct}/{weekScore.total} answered
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        {topicsList.map((topic, i) => (
          <span
            key={i}
            className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 truncate max-w-[150px]"
          >
            {topic.trim()}
          </span>
        ))}
      </div>
    </div>
  );
}
