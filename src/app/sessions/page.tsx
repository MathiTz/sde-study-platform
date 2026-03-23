import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { STEP_LABELS, COMPLETED_STEP, PASSING_SCORE_THRESHOLD, Step } from "@/lib/types";
import { safeParseEvaluation } from "@/lib/utils/json";

export default async function SessionsPage() {
  const authSession = await auth();
  if (!authSession?.user?.id) redirect("/");

  const sessions = await prisma.session.findMany({
    where: { userId: authSession.user.id },
    include: {
      problem: { select: { title: true, slug: true, difficulty: true } },
      steps: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Session History</h1>
        <p className="mt-1 text-muted-foreground">
          Review your past interview sessions and feedback.
        </p>
      </div>

      {sessions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No sessions yet. Start one from the{" "}
          <Link href="/" className="text-accent hover:underline">
            dashboard
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-6">
          {sessions.map((session) => {
            const isCompleted = session.currentStep === COMPLETED_STEP;
            return (
              <div
                key={session.id}
                className="rounded-lg border border-border"
              >
                {/* Session Header */}
                <div className="flex items-center justify-between border-b border-border p-4">
                  <div className="flex items-center gap-3">
                    <DifficultyBadge difficulty={session.problem.difficulty} />
                    <Link
                      href={`/session/${session.id}`}
                      className="font-semibold hover:text-accent"
                    >
                      {session.problem.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {isCompleted && session.overallScore != null && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          session.overallScore >= PASSING_SCORE_THRESHOLD
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {Math.round(session.overallScore)}%
                      </span>
                    )}
                    {session.status === "PAUSED" && (
                      <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Paused
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {isCompleted
                        ? "Completed"
                        : `In progress — ${session.currentStep.replace(/_/g, " ").toLowerCase()}`}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(session.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Step Results */}
                {session.steps.length > 0 && (
                  <div className="divide-y divide-border">
                    {session.steps.map((step) => {
                      const evaluation = safeParseEvaluation(step.aiEvaluation);
                      return (
                        <div key={step.id} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${step.passed ? "bg-success" : "bg-danger"}`}
                              />
                              <span className="text-sm font-medium">
                                {STEP_LABELS[step.step as Step]}
                              </span>
                            </div>
                            {evaluation && (
                              <span className="text-xs text-muted-foreground">
                                {evaluation.score}/100
                              </span>
                            )}
                          </div>
                          {evaluation && (
                            <div className="mt-2 grid gap-2 text-xs sm:grid-cols-3">
                              {evaluation.feedback.strengths.length > 0 && (
                                <div>
                                  <span className="font-medium text-success">
                                    Strengths:
                                  </span>
                                  <ul className="mt-0.5 space-y-0.5 text-muted-foreground">
                                    {evaluation.feedback.strengths.map(
                                      (s, i) => (
                                        <li key={i}>+ {s}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                              {evaluation.feedback.weaknesses.length > 0 && (
                                <div>
                                  <span className="font-medium text-danger">
                                    Weaknesses:
                                  </span>
                                  <ul className="mt-0.5 space-y-0.5 text-muted-foreground">
                                    {evaluation.feedback.weaknesses.map(
                                      (w, i) => (
                                        <li key={i}>- {w}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                              {evaluation.feedback.suggestions.length > 0 && (
                                <div>
                                  <span className="font-medium text-accent">
                                    Suggestions:
                                  </span>
                                  <ul className="mt-0.5 space-y-0.5 text-muted-foreground">
                                    {evaluation.feedback.suggestions.map(
                                      (s, i) => (
                                        <li key={i}>→ {s}</li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
