import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { startSession } from "@/lib/actions/sessions";
import { parseReferenceData, STEP_LABELS, STEP_DURATIONS, STEPS } from "@/lib/types";
import Link from "next/link";

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await prisma.problem.findUnique({ where: { slug } });
  if (!problem) notFound();

  const session = await auth();
  const ref = parseReferenceData(problem.referenceData);

  const startWithProblem = startSession.bind(null, problem.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to problems
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{problem.title}</h1>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>
        <p className="mt-3 text-lg text-muted-foreground">
          {problem.description}
        </p>
      </div>

      {/* Interview Structure Preview */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="mb-4 text-lg font-semibold">Interview Structure</h2>
        <div className="space-y-3">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {idx + 1}
              </span>
              <div className="flex-1">
                <span className="font-medium">{STEP_LABELS[step]}</span>
                <span className="ml-2 text-sm text-muted-foreground">
                  ~{STEP_DURATIONS[step]} min
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Total estimated time: ~42 minutes. You&apos;ll receive AI feedback at
          each step and need to pass a threshold to advance.
        </p>
      </div>

      {/* Key Topics */}
      <div className="rounded-lg border border-border p-6">
        <h2 className="mb-3 text-lg font-semibold">Key Topics</h2>
        <div className="flex flex-wrap gap-2">
          {ref.deepDives.map((dd) => (
            <span
              key={dd.topic}
              className="rounded-full bg-muted px-3 py-1 text-sm"
            >
              {dd.topic}
            </span>
          ))}
        </div>
      </div>

      {/* Start Button */}
      {session?.user ? (
        <form action={startWithProblem}>
          <button className="w-full rounded-lg bg-accent px-6 py-3 text-center font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
            Start Interview Session
          </button>
        </form>
      ) : (
        <p className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          Sign in with GitHub to start a practice session.
        </p>
      )}
    </div>
  );
}
