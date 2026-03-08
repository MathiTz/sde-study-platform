"use client";

import { useState } from "react";
import type { AIEvaluation } from "@/lib/types";

interface FeedbackPanelProps {
  evaluation: AIEvaluation;
}

const FEEDBACK_SECTIONS = [
  { key: "strengths" as const, label: "Strengths", color: "text-success", prefix: "+" },
  { key: "weaknesses" as const, label: "Areas to Improve", color: "text-danger", prefix: "-" },
  { key: "suggestions" as const, label: "Suggestions", color: "text-accent", prefix: "→" },
];

export function FeedbackPanel({ evaluation }: FeedbackPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-lg border border-border bg-muted/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <div className="flex items-center gap-3">
          <span>Feedback</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              evaluation.passed
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {evaluation.score}/100
          </span>
        </div>
        <span className="text-muted-foreground">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {isExpanded && (
        <div className="space-y-4 border-t border-border px-4 py-4">
          {FEEDBACK_SECTIONS.map(({ key, label, color, prefix }) => {
            const items = evaluation.feedback[key];
            if (items.length === 0) return null;
            return (
              <div key={key}>
                <h4 className={`mb-1.5 text-xs font-semibold uppercase tracking-wider ${color}`}>
                  {label}
                </h4>
                <ul className="space-y-1">
                  {items.map((item, i) => (
                    <li key={i} className="text-sm text-foreground">
                      {prefix} {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
