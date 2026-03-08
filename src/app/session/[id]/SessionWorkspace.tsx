"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitStep, advanceStep } from "@/lib/actions/sessions";
import {
  Step,
  STEP_LABELS,
  STEP_DURATIONS,
  STEP_PROMPTS,
  RICH_TEXT_STEPS,
  AIEvaluation,
  parseReferenceData,
} from "@/lib/types";
import { FeedbackPanel } from "@/components/FeedbackPanel";
import { ExcalidrawBoard } from "@/components/ExcalidrawBoard";
import { StepTimer } from "@/components/StepTimer";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  RequirementsEditor,
  RequirementsData,
  serializeRequirements,
  deserializeRequirements,
} from "@/components/RequirementsEditor";

interface ExistingAttempt {
  step: string;
  userInput: string;
  aiEvaluation: string | null;
  passed: boolean;
}

interface SessionWorkspaceProps {
  sessionId: string;
  currentStep: string;
  referenceData: string;
  existingAttempts: ExistingAttempt[];
}


export function SessionWorkspace({
  sessionId,
  currentStep,
  referenceData,
  existingAttempts,
}: SessionWorkspaceProps) {
  const step = currentStep as Step;
  const ref = parseReferenceData(referenceData);
  const router = useRouter();

  const [input, setInput] = useState("");
  const [requirementsData, setRequirementsData] =
    useState<RequirementsData | null>(() => {
      const existing = existingAttempts.find((a) => a.step === "REQUIREMENTS");
      if (existing) return deserializeRequirements(existing.userInput);
      return null;
    });
  const [excalidrawData, setExcalidrawData] = useState("");
  const [feedback, setFeedback] = useState<AIEvaluation | null>(() => {
    const existing = existingAttempts.find((a) => a.step === step);
    if (existing?.aiEvaluation) {
      try {
        return JSON.parse(existing.aiEvaluation);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isPending, startTransition] = useTransition();
  const [showSidebar, setShowSidebar] = useState(false);

  const isDrawingStep = step === "HIGH_LEVEL_DESIGN";
  const isRequirementsStep = step === "REQUIREMENTS";
  const isRichTextStep = RICH_TEXT_STEPS.includes(step);

  const getUserInput = (): string => {
    if (isRequirementsStep && requirementsData) {
      return serializeRequirements(requirementsData);
    }
    if (isDrawingStep) {
      return JSON.stringify({ diagram: excalidrawData, notes: input });
    }
    return input;
  };

  const canSubmit = (): boolean => {
    if (isPending) return false;
    if (isRequirementsStep) {
      if (!requirementsData) return false;
      const hasFR = requirementsData.functional.some((f) => f.trim());
      const hasNFR = requirementsData.nonFunctional.some((f) => f.trim());
      return hasFR && hasNFR;
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
        if (attempt.aiEvaluation) {
          setFeedback(JSON.parse(attempt.aiEvaluation));
        }
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

  // Get existing content for rich text steps
  const existingContent = existingAttempts.find((a) => a.step === step)
    ?.userInput;

  // ─── Full-page Excalidraw layout for HLD ───
  if (isDrawingStep) {
    return (
      <div className="fixed inset-0 z-40 flex flex-col bg-background">
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold">{STEP_LABELS[step]}</h2>
            <StepTimer key={step} durationMinutes={STEP_DURATIONS[step]} />
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
          {/* Excalidraw Canvas */}
          <div className={`flex-1 ${showSidebar ? "mr-[380px]" : ""}`}>
            <ExcalidrawBoard
              fullPage
              onChange={setExcalidrawData}
              initialData={
                existingContent
                  ? (() => {
                      try {
                        return JSON.parse(existingContent).diagram;
                      } catch {
                        return undefined;
                      }
                    })()
                  : undefined
              }
            />
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <div className="absolute right-0 top-0 bottom-0 w-[380px] overflow-y-auto border-l border-border bg-background p-4 space-y-4">
              <p className="text-xs text-muted-foreground">
                {STEP_PROMPTS[step]}
              </p>

              {/* Design Notes */}
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

              {/* Hints */}
              <StepHints step={step} referenceData={ref} />

              {/* Feedback */}
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
      {/* Step Header */}
      <div className="rounded-lg border border-border p-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{STEP_LABELS[step]}</h2>
          <StepTimer key={step} durationMinutes={STEP_DURATIONS[step]} />
        </div>
        <p className="text-sm text-muted-foreground">{STEP_PROMPTS[step]}</p>
      </div>

      {/* Input Area */}
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
              {feedback.passed
                ? "Continue to Next Step →"
                : "Skip to Next Step →"}
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && <FeedbackPanel evaluation={feedback} />}

      {/* Reference Hints (collapsed) */}
      <StepHints step={step} referenceData={ref} />
    </div>
  );
}

function StepHints({
  step,
  referenceData,
}: {
  step: Step;
  referenceData: ReturnType<typeof parseReferenceData>;
}) {
  const [showHints, setShowHints] = useState(false);

  const hints: Record<Step, string[]> = {
    REQUIREMENTS: [
      "Think about 3 core functional requirements",
      "Consider: CAP theorem, scalability, latency, durability",
      `Key insight: ${referenceData.requirements.keyInsight}`,
    ],
    CORE_ENTITIES: [
      "Who are the actors in the system?",
      "What nouns/resources are needed to satisfy the requirements?",
      "Keep it simple — you'll refine during high-level design",
    ],
    API_DESIGN: [
      "Map functional requirements to endpoints",
      "Use REST by default (POST, GET, PUT, DELETE)",
      "Consider pagination, authentication, rate limiting",
    ],
    HIGH_LEVEL_DESIGN: [
      "Start with the client and work your way to the data store",
      "Include: load balancers, services, databases, caches, queues",
      "Show the data flow for each core use case",
    ],
    DEEP_DIVES: [
      "Pick 2-3 interesting areas to go deep on",
      "Discuss trade-offs, not just solutions",
      "Consider: scaling bottlenecks, failure modes, data consistency",
    ],
  };

  return (
    <div className="rounded-lg border border-dashed border-border">
      <button
        onClick={() => setShowHints(!showHints)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
      >
        <span>💡 Hints</span>
        <span>{showHints ? "▲" : "▼"}</span>
      </button>
      {showHints && (
        <ul className="space-y-1.5 border-t border-dashed border-border px-4 py-3">
          {hints[step].map((hint, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              • {hint}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
