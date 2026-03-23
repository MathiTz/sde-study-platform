import { notFound } from "next/navigation";
import { getSession } from "@/lib/actions/sessions";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { StepIndicator } from "@/components/StepIndicator";
import { SessionWorkspace } from "./SessionWorkspace";
import Link from "next/link";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) notFound();

  const completedSteps = session.steps
    .filter((s) => s.passed)
    .map((s) => s.step);

  const isCompleted = session.currentStep === "COMPLETED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/problems/${session.problem.slug}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {session.problem.title}
          </Link>
          <DifficultyBadge difficulty={session.problem.difficulty} />
        </div>
        {isCompleted && session.overallScore != null && (
          <span className="rounded-full bg-accent/10 px-3 py-1 text-sm font-semibold text-accent">
            Score: {Math.round(session.overallScore)}%
          </span>
        )}
      </div>

      {/* Step Indicator */}
      <div className="flex justify-center">
        <StepIndicator
          currentStep={session.currentStep}
          completedSteps={completedSteps}
        />
      </div>

      {/* Workspace or Completion */}
      {isCompleted ? (
        <div className="rounded-lg border border-border p-8 text-center">
          <h2 className="text-2xl font-bold">Session Complete!</h2>
          <p className="mt-2 text-muted-foreground">
            You scored {Math.round(session.overallScore ?? 0)}% overall.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <SessionWorkspace
          sessionId={session.id}
          currentStep={session.currentStep}
          status={session.status}
          timerElapsed={session.timerElapsed}
          referenceData={session.problem.referenceData}
          existingAttempts={session.steps.map((s) => ({
            step: s.step,
            userInput: s.userInput,
            aiEvaluation: s.aiEvaluation,
            passed: s.passed,
          }))}
        />
      )}
    </div>
  );
}
