"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { LessonCard } from "@/components/lessons/LessonCard";
import { LessonContent } from "@/components/lessons/LessonContent";
import { LESSONS } from "@/lib/lessons";
import { lessonContent } from "@/lib/lessons/content";
import {
  clientServerContent,
  databasesContent,
  cachingContent,
} from "@/lib/lessons/content";

interface StudyResource {
  id: string;
  title: string;
  url: string;
  source: string;
  topics: string;
  difficulty: string;
  description: string;
  resourceType: string;
}

const LESSON_CONTENT_MAP: Record<string, string> = {
  ...lessonContent,
  "client-server": clientServerContent,
  "databases": databasesContent,
  "caching": cachingContent,
};

interface LessonProgress {
  lessonId: string;
  readAt: string;
}

const READ_THRESHOLD = 80;

export function LessonsClient({ resources }: { resources: StudyResource[] }) {
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [readingProgress, setReadingProgress] = useState<number>(0);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch("/api/lessons/progress");
        if (res.ok) {
          const data = await res.json();
          setCompletedLessons(new Set(data.progress.map((p: LessonProgress) => p.lessonId)));
        }
      } catch (error) {
        console.error("Failed to fetch lesson progress:", error);
      }
    }
    fetchProgress();
  }, []);

  const markLessonComplete = useCallback(async (lessonId: string) => {
    if (completedLessons.has(lessonId)) return;
    
    try {
      const res = await fetch("/api/lessons/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId }),
      });
      if (res.ok) {
        setCompletedLessons((prev) => new Set([...prev, lessonId]));
        setShowCompletionMessage(true);
        setTimeout(() => setShowCompletionMessage(false), 3000);
      }
    } catch (error) {
      console.error("Failed to mark lesson as complete:", error);
    }
  }, [completedLessons]);

  useEffect(() => {
    const timer = setTimeout(() => setReadingProgress(0), 0);
    return () => clearTimeout(timer);
  }, [selectedLessonId]);

  useEffect(() => {
    if (!selectedLessonId || completedLessons.has(selectedLessonId)) return;

    const handleScroll = () => {
      const contentEl = contentRef.current;
      if (!contentEl) return;

      const rect = contentEl.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const elementTop = rect.top;
      const elementHeight = rect.height;

      const scrolledPast = windowHeight - elementTop;
      const totalToScroll = elementHeight;
      
      if (totalToScroll <= 0) {
        markLessonComplete(selectedLessonId);
        return;
      }

      const progress = Math.round((scrolledPast / totalToScroll) * 100);
      const clampedProgress = Math.max(0, Math.min(100, progress));
      setReadingProgress(clampedProgress);

      if (clampedProgress >= READ_THRESHOLD) {
        markLessonComplete(selectedLessonId);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [selectedLessonId, completedLessons, markLessonComplete]);

  const filteredLessons = LESSONS.filter((lesson) =>
    filter === "all"
      ? true
      : lesson.topics.some((t) => t.toLowerCase().includes(filter.toLowerCase()))
  );

  const selectedLesson = LESSONS.find((l) => l.id === selectedLessonId);
  const selectedContent = selectedLessonId ? LESSON_CONTENT_MAP[selectedLessonId] : null;
  const isSelectedLessonComplete = selectedLessonId ? completedLessons.has(selectedLessonId) : false;

  const getResourcesForLesson = (lessonId: string) => {
    const lesson = LESSONS.find((l) => l.id === lessonId);
    if (!lesson) return [];
    return resources.filter((r) =>
      lesson.topics.some((t) =>
        r.topics.toLowerCase().includes(t.toLowerCase())
      )
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {showCompletionMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Lesson completed! You can now access the corresponding study plan.</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Study Materials
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Learn system design fundamentals with detailed explanations and real code examples.
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
          Complete lessons (scroll through {READ_THRESHOLD}%+) to unlock corresponding study-plan weeks
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-80 shrink-0">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Filter topics..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>

          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {filteredLessons.map((lesson) => {
              const lessonResources = getResourcesForLesson(lesson.id);
              const isCompleted = completedLessons.has(lesson.id);
              return (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  resourceCount={lessonResources.length}
                  isSelected={selectedLessonId === lesson.id}
                  isCompleted={isCompleted}
                  onClick={() =>
                    setSelectedLessonId(
                      selectedLessonId === lesson.id ? null : lesson.id
                    )
                  }
                />
              );
            })}
          </div>
        </div>

        <div className="lg:w-2/3">
          {selectedLesson && selectedContent ? (
            <div ref={contentRef}>
              {!isSelectedLessonComplete && (
                <div className="sticky top-4 z-40 mb-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {readingProgress >= READ_THRESHOLD ? "Completed!" : "Scroll to read"}
                    </span>
                    <span className="text-gray-500">{readingProgress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        readingProgress >= READ_THRESHOLD
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(readingProgress, 100)}%` }}
                    />
                  </div>
                </div>
              )}
              <LessonContent
                lesson={selectedLesson}
                content={selectedContent}
                resources={getResourcesForLesson(selectedLesson.id).map((r) => ({
                  title: r.title,
                  url: r.url,
                  source: r.source,
                }))}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <div className="text-center">
                <span className="text-6xl mb-4 block">📚</span>
                <p className="text-xl text-gray-500 dark:text-gray-400">
                  Select a lesson to view content
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Each lesson includes detailed explanations and code examples
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
