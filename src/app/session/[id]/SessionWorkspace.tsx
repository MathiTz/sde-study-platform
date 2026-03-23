"use client";

import { useState, useMemo, useTransition, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { submitStep, advanceStep, pauseSession, resumeSession } from "@/lib/actions/sessions";
import {
  Step,
  STEP_LABELS,
  STEP_DURATIONS,
  STEP_PROMPTS,
  RICH_TEXT_STEPS,
  AIEvaluation,
  parseReferenceData,
  RequirementsData,
  serializeRequirements,
  deserializeRequirements,
} from "@/lib/types";
import { safeParseEvaluation } from "@/lib/utils/json";
import { buildInitialHLDScene } from "@/lib/utils/excalidraw";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { ExcalidrawBoard } from "@/components/ExcalidrawBoard";
import { StepTimer } from "@/components/StepTimer";
import { RichTextEditor } from "@/components/RichTextEditor";
import { RequirementsEditor } from "@/components/RequirementsEditor";
import { StepHints } from "@/components/StepHints";

interface ExistingAttempt {
  step: string;
  userInput: string;
  aiEvaluation: string | null;
  passed: boolean;
}

interface SessionWorkspaceProps {
  sessionId: string;
  currentStep: string;
  status: string;
  timerElapsed: number;
  referenceData: string;
  existingAttempts: ExistingAttempt[];
}

export function SessionWorkspace({
  sessionId,
  currentStep,
  status,
  timerElapsed,
  referenceData,
  existingAttempts,
}: SessionWorkspaceProps) {
  const step = currentStep as Step;
  const ref = useMemo(() => parseReferenceData(referenceData), [referenceData]);
  const router = useRouter();

  const [input, setInput] = useState("");
  const [requirementsData, setRequirementsData] = useState<RequirementsData | null>(
    () => {
      const existing = existingAttempts.find((a) => a.step === "REQUIREMENTS");
      return existing ? deserializeRequirements(existing.userInput) : null;
    }
  );
  const [excalidrawData, setExcalidrawData] = useState("");
  const [feedback, setFeedback] = useState<AIEvaluation | null>(() => {
    const existing = existingAttempts.find((a) => a.step === step);
    return safeParseEvaluation(existing?.aiEvaluation);
  });
  const [isPending, startTransition] = useTransition();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isPaused, setIsPaused] = useState(status === "PAUSED");
  const elapsedRef = useRef(timerElapsed);
  const handleElapsedChange = useCallback((s: number) => { elapsedRef.current = s; }, []);

  const isDrawingStep = step === "HIGH_LEVEL_DESIGN";
  const isRequirementsStep = step === "REQUIREMENTS";
  const isRichTextStep = RICH_TEXT_STEPS.includes(step);

  const existingContent = useMemo(
    () => existingAttempts.find((a) => a.step === step)?.userInput,
    [existingAttempts, step]
  );

  const initialHLDData = useMemo(() => {
    if (existingContent) {
      try {
        return JSON.parse(existingContent).diagram as string;
      } catch {
        return undefined;
      }
    }
    const coreAttempt = existingAttempts.find((a) => a.step === "CORE_ENTITIES");
    const apiAttempt = existingAttempts.find((a) => a.step === "API_DESIGN");
    if (coreAttempt?.userInput || apiAttempt?.userInput) {
      return buildInitialHLDScene(
        coreAttempt?.userInput ?? "",
        apiAttempt?.userInput ?? ""
      );
    }
    return undefined;
  }, [existingContent, existingAttempts]);

  const getUserInput = (): string => {
    if (isRequirementsStep && requirementsData) return serializeRequirements(requirementsData);
    if (isDrawingStep) return JSON.stringify({ diagram: excalidrawData, notes: input });
    return input;
  };

  const canSubmit = (): boolean => {
    if (isPending) return false;
    if (isRequirementsStep) {
      if (!requirementsData) return false;
      return (
        requirementsData.functional.some((f) => f.trim()) &&
        requirementsData.nonFunctional.some((f) => f.trim())
      );
    }
    if (isDrawingStep) return !!excalidrawData;
    return !!input.trim();
  };

  const handleSubmit = () => {
    const userInput = getUserInput();
    if (!userInput.trim()) return;

    startTransition(async () => {
      try {
        const attempt = await submitStep(sessionId, step, userInput);
        setFeedback(safeParseEvaluation(attempt.aiEvaluation));
      } catch (error) {
        console.error("Failed to submit step:", error);
      }
    });
  };

  const handleAdvance = () => {
    startTransition(async () => {
      try {
        await advanceStep(sessionId);
        setInput("");
        setExcalidrawData("");
        setRequirementsData(null);
        setFeedback(null);
        router.refresh();
      } catch (error) {
        console.error("Failed to advance:", error);
      }
    });
  };

  const handleTogglePause = () => {
    startTransition(async () => {
      if (isPaused) {
        await resumeSession(sessionId);
        setIsPaused(false);
      } else {
        await pauseSession(sessionId, elapsedRef.current);
        setIsPaused(true);
      }
    });
  };

  const timerControls = (
    <>
      <StepTimer
        key={step}
        durationMinutes={STEP_DURATIONS[step]}
        paused={isPending || isPaused}
        initialSeconds={timerElapsed}
        onElapsedChange={handleElapsedChange}
      />
      <button
        onClick={handleTogglePause}
        disabled={isPending}
        title={isPaused ? "Resume session" : "Pause session"}
        className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
      >
        {isPaused ? "▶" : "⏸"}
      </button>
    </>
  );

  // ─── Full-page Excalidraw layout for HLD ───
  if (isDrawingStep) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold">{STEP_LABELS[step]}</h2>
            {timerControls}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                showSidebar
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {showSidebar ? "Hide Panel" : "Notes & Hints"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? "Evaluating..." : "Submit for Review"}
            </button>
            {feedback && (
              <button
                onClick={handleAdvance}
                disabled={isPending}
                className="rounded-md border border-border px-4 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                {feedback.passed ? "Next Step →" : "Skip →"}
              </button>
            )}
          </div>
        </div>

        {/* Canvas + Sidebar */}
        <div className="relative flex flex-1 overflow-hidden">
          <div className={`flex-1 ${showSidebar ? "mr-[380px]" : ""}`}>
            <ExcalidrawBoard fullPage onChange={setExcalidrawData} initialData={initialHLDData} />
          </div>

          {showSidebar && (
            <div className="absolute right-0 top-0 bottom-0 w-[380px] overflow-y-auto border-l border-border bg-background p-4 space-y-4">
              <p className="text-xs text-muted-foreground">{STEP_PROMPTS[step]}</p>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Design Notes
                </h3>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Add notes about your design decisions..."
                  className="min-h-[120px] w-full rounded-lg border border-border bg-background p-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  disabled={isPending}
                />
              </div>

              <StepHints step={step} referenceData={ref} />
              {feedback && <FeedbackPanel evaluation={feedback} />}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Standard layout for other steps ───
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{STEP_LABELS[step]}</h2>
          <div className="flex items-center gap-2">{timerControls}</div>
        </div>
        <p className="text-sm text-muted-foreground">{STEP_PROMPTS[step]}</p>
      </div>

      <div className="space-y-4">
        {isRequirementsStep && (
          <RequirementsEditor
            onChange={setRequirementsData}
            initialData={requirementsData ?? undefined}
            disabled={isPending}
          />
        )}

        {isRichTextStep && (
          <RichTextEditor
            key={step}
            onChange={setInput}
            initialContent={existingContent}
            placeholder={`Describe your ${STEP_LABELS[step].toLowerCase()} here...`}
            disabled={isPending}
          />
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="rounded-md bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Evaluating..." : "Submit for Review"}
          </button>

          {feedback && (
            <button
              onClick={handleAdvance}
              disabled={isPending}
              className="rounded-md border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              {feedback.passed ? "Continue to Next Step →" : "Skip to Next Step →"}
            </button>
          )}
        </div>
      </div>

      {feedback && <FeedbackPanel evaluation={feedback} />}
      <StepHints step={step} referenceData={ref} />
    </div>
  );
}
