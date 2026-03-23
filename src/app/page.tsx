import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { RecommendedResources } from "@/components/RecommendedResources";
import { getRecommendedResources } from "@/lib/actions/resources";
import { DIFFICULTY_ORDER } from "@/lib/types";

export default async function Home() {
  const [problems, session] = await Promise.all([
    prisma.problem.findMany({
      select: { id: true, title: true, slug: true, difficulty: true, description: true },
    }),
    auth(),
  ]);

  const recentSessions = session?.user?.id
    ? await prisma.session.findMany({
        where: { userId: session.user.id },
        include: { problem: { select: { title: true, slug: true, difficulty: true } } },
        orderBy: { startedAt: "desc" },
        take: 5,
      })
    : [];

  const grouped = problems.reduce(
    (acc, p) => {
      if (!acc[p.difficulty]) acc[p.difficulty] = [];
      acc[p.difficulty].push(p);
      return acc;
    },
    {} as Record<string, typeof problems>
  );

  const sortedDifficulties = Object.keys(grouped).sort(
    (a, b) => (DIFFICULTY_ORDER[a as keyof typeof DIFFICULTY_ORDER] ?? 0) - (DIFFICULTY_ORDER[b as keyof typeof DIFFICULTY_ORDER] ?? 0)
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Design Interview Prep</h1>
        <p className="mt-2 text-muted-foreground">
          Practice with structured problems, draw architecture diagrams, and get AI feedback.
        </p>
      </div>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Recent Sessions</h2>
          <div className="grid gap-3">
            {recentSessions.map((s) => (
              <Link
                key={s.id}
                href={`/session/${s.id}`}
                className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <DifficultyBadge difficulty={s.problem.difficulty} />
                  <span className="font-medium">{s.problem.title}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {s.status === "PAUSED" && (
                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Paused
                    </span>
                  )}
                  <span className="capitalize">
                    {s.currentStep === "COMPLETED" ? "Completed" : s.currentStep.toLowerCase().replace("_", " ")}
                  </span>
                  {s.overallScore != null && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                      {Math.round(s.overallScore)}%
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recommended Resources */}
      {session?.user && <RecommendedResourcesSection />}

      {/* Problem List */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Problems</h2>
        <div className="space-y-8">
          {sortedDifficulties.map((difficulty) => (
            <div key={difficulty}>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {difficulty}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[difficulty].map((problem) => (
                  <Link
                    key={problem.id}
                    href={`/problems/${problem.slug}`}
                    className="group rounded-lg border border-border p-4 transition-colors hover:border-accent/50 hover:bg-muted/30"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <DifficultyBadge difficulty={problem.difficulty} />
                      <h4 className="font-semibold group-hover:text-accent">
                        {problem.title}
                      </h4>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {problem.description}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

async function RecommendedResourcesSection() {
  const resources = await getRecommendedResources(6);
  if (resources.length === 0) return null;

  return (
    <div>
      <RecommendedResources resources={resources} />
      <Link
        href="/resources"
        className="mt-3 inline-flex items-center text-sm text-accent hover:underline"
      >
        Browse all resources →
      </Link>
    </div>
  );
}
