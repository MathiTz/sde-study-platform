"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { StudyQuestion, QuestionAttempt } from "@/lib/types";
import { QUESTION_TYPE_LABELS } from "./constants";

export const FEEDBACK_COLORS = {
  strengths: "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800",
  weaknesses: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800",
  suggestions: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800",
} as const;

export const RESULT_COLORS = {
  correct: "bg-green-100 dark:bg-green-900 border-green-300 dark:border-green-700",
  incorrect: "bg-red-100 dark:bg-red-900 border-red-300 dark:border-red-700",
} as const;

interface QuestionCardProps {
  question: StudyQuestion;
  onSubmit: (
    questionId: string,
    answer: string,
    type: string
  ) => Promise<{
    attempt: QuestionAttempt;
    explanation: string | null;
    correctCount: number;
    totalQuestions: number;
    weekScore: number | null;
  } | { error: string }>;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionCard({
  question,
  onSubmit,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const router = useRouter();
  const [answer, setAnswer] = useState<string[]>(
    question.attempts[0] ? JSON.parse(question.attempts[0].userAnswer) : []
  );
  const [abstractAnswer, setAbstractAnswer] = useState(
    question.attempts[0]?.userAnswer || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    isCorrect: boolean | null;
    score: number | null;
    aiFeedback: QuestionAttempt["aiFeedback"];
    explanation: string | null;
  } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const lastAttempt = question.attempts[0];
  const isAnswered = lastAttempt !== undefined;
  const hasDrawing = question.questionType === "DRAWING" && lastAttempt?.userAnswer;

  const handleOptionToggle = (optionText: string) => {
    if (question.questionType === "SINGLE") {
      setAnswer([optionText]);
    } else {
      setAnswer((prev) =>
        prev.includes(optionText)
          ? prev.filter((a) => a !== optionText)
          : [...prev, optionText]
      );
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const userAnswer =
      question.questionType === "ABSTRACT" || question.questionType === "DRAWING"
        ? abstractAnswer
        : JSON.stringify(answer);

    setIsSubmitting(true);
    const response = await onSubmit(question.id, userAnswer, question.questionType);
    setIsSubmitting(false);

    if ("error" in response) return;

    setResult({
      isCorrect: response.attempt.isCorrect,
      score: response.attempt.score,
      aiFeedback: response.attempt.aiFeedback,
      explanation: response.explanation,
    });
  };

  const canSubmit =
    !isSubmitting &&
    (question.questionType === "ABSTRACT"
      ? abstractAnswer.trim() !== ""
      : question.questionType === "DRAWING"
      ? false
      : answer.length > 0);

  return (
    <div
      className={`p-6 rounded-lg border ${
        isAnswered
          ? lastAttempt?.isCorrect
            ? RESULT_COLORS.correct
            : RESULT_COLORS.incorrect
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <span className="text-sm text-gray-500">
          Question {questionNumber} of {totalQuestions}
        </span>
        <span
          className={`text-xs px-2 py-1 rounded-full ${
            QUESTION_TYPE_LABELS[question.questionType]
          }`}
        >
          {question.questionType}
        </span>
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {question.question}
      </h3>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
          {question.topic}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
          {question.difficulty}
        </span>
      </div>

      {(question.questionType === "SINGLE" ||
        question.questionType === "MULTIPLE") &&
        question.options && (
          <div className="space-y-2 mb-4">
            {question.options.map((option, idx) => {
              const isSelected = answer.includes(option.text);
              const showResult = result !== null;
              const wasCorrect = option.isCorrect;

              return (
                <button
                  key={idx}
                  onClick={() => !isAnswered && handleOptionToggle(option.text)}
                  disabled={isAnswered}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? showResult
                        ? wasCorrect
                          ? "border-green-500 bg-green-100 dark:bg-green-900"
                          : "border-red-500 bg-red-100 dark:bg-red-900"
                        : "border-blue-500 bg-blue-50 dark:bg-blue-900"
                      : showResult && wasCorrect
                        ? "border-green-500 bg-green-50 dark:bg-green-900"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                  } ${isAnswered ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {option.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      {(question.questionType === "ABSTRACT" ||
        question.questionType === "DRAWING") && (
        <div className="mb-4">
          {question.questionType === "DRAWING" ? (
            <div className="space-y-3">
              {hasDrawing ? (
                <div className="p-4 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
                  <div className="flex items-center justify-between">
                    <span className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Drawing Submitted
                    </span>
                    <button
                      onClick={() => {
                        const returnTo = encodeURIComponent(window.location.pathname);
                        router.push(`/study-plan/draw/${question.id}?returnTo=${returnTo}`);
                      }}
                      className="text-sm px-3 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const returnTo = encodeURIComponent(window.location.pathname);
                    router.push(`/study-plan/draw/${question.id}?returnTo=${returnTo}`);
                  }}
                  className="w-full py-4 px-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span className="font-medium">Draw Your Diagram</span>
                </button>
              )}
            </div>
          ) : (
            <textarea
              value={abstractAnswer}
              onChange={(e) => setAbstractAnswer(e.target.value)}
              disabled={isAnswered}
              placeholder="Write your answer here..."
              className="w-full h-40 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
            />
          )}
        </div>
      )}

      {question.hint && !showHint && !isAnswered && (
        <button
          onClick={() => setShowHint(true)}
          className="text-sm text-blue-600 hover:text-blue-700 mb-4"
        >
          Show hint
        </button>
      )}

      {showHint && question.hint && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Hint:</strong> {question.hint}
          </p>
        </div>
      )}

      {!isAnswered && question.questionType !== "DRAWING" && (
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Submitting..." : "Submit Answer"}
        </button>
      )}

      {result && (
        <div className="mt-4 space-y-4">
          <div
            className={`p-4 rounded-lg ${
              result.isCorrect ? RESULT_COLORS.correct : RESULT_COLORS.incorrect
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {result.isCorrect ? "Correct!" : "Incorrect"}
              </span>
              {result.score !== null && (
                <span className="text-lg font-bold">
                  {Math.round(result.score)}%
                </span>
              )}
            </div>
          </div>

          {result.aiFeedback && (
            <div className="space-y-3">
              {result.aiFeedback.strengths.length > 0 && (
                <FeedbackSection
                  title="Strengths"
                  items={result.aiFeedback.strengths}
                  type="strengths"
                />
              )}

              {result.aiFeedback.weaknesses.length > 0 && (
                <FeedbackSection
                  title="Areas for Improvement"
                  items={result.aiFeedback.weaknesses}
                  type="weaknesses"
                />
              )}

              {result.aiFeedback.suggestions.length > 0 && (
                <FeedbackSection
                  title="Suggestions"
                  items={result.aiFeedback.suggestions}
                  type="suggestions"
                />
              )}
            </div>
          )}

          {result.explanation && (
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                Explanation
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {result.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface FeedbackSectionProps {
  title: string;
  items: string[];
  type: keyof typeof FEEDBACK_COLORS;
}

function FeedbackSection({ title, items, type }: FeedbackSectionProps) {
  const colorClass = FEEDBACK_COLORS[type];

  return (
    <div className={`p-3 rounded-lg border ${colorClass}`}>
      <h4 className="font-medium mb-1">{title}</h4>
      <ul className="text-sm list-disc list-inside">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
