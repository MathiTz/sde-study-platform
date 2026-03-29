"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ExcalidrawBoard } from "@/components/ExcalidrawBoard";
import { QUESTION_TYPE_LABELS } from "@/components/study-plan/constants";

interface DrawWorkspaceProps {
  questionId: string;
  question: string;
  hint?: string;
  existingDrawing: string;
  returnTo: string;
}

export function DrawWorkspace({
  questionId,
  question,
  hint,
  existingDrawing,
  returnTo,
}: DrawWorkspaceProps) {
  const router = useRouter();
  const [drawingData, setDrawingData] = useState<string>(existingDrawing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDrawingChange = useCallback((sceneData: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDrawingData(sceneData);
    }, 500);
  }, []);

  const handleSubmit = async () => {
    if (isSubmitting || !drawingData) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/study-plan/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          userAnswer: drawingData,
          type: "DRAWING",
        }),
      });

      if (res.ok) {
        router.push(returnTo);
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to submit drawing:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(returnTo)}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            ← Back
          </button>
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">
              {QUESTION_TYPE_LABELS.DRAWING}
            </span>
            <span className="max-w-md truncate">{question}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHint(!showHint)}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            {showHint ? "Hide Hints" : "Show Hints"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !drawingData}
            className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save & Return"}
          </button>
        </div>
      </div>

      {showHint && hint && (
        <div className="shrink-0 border-b border-border bg-yellow-50 dark:bg-yellow-950 px-4 py-3">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Hint:</strong> {hint}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        <ExcalidrawBoard
          fullPage
          onChange={handleDrawingChange}
          initialData={existingDrawing}
        />
      </div>
    </div>
  );
}
