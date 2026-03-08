"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

/**
 * Get all study resources, optionally filtered by topic and difficulty.
 */
export async function getAllResources(filters?: {
  topic?: string;
  difficulty?: string;
}) {
  const resources = await prisma.studyResource.findMany({
    orderBy: { createdAt: "desc" },
  });

  let filtered = resources;

  if (filters?.topic) {
    const t = filters.topic.toLowerCase();
    filtered = filtered.filter((r) =>
      r.topics
        .split(",")
        .some((tag) => tag.trim().toLowerCase().includes(t) || t.includes(tag.trim().toLowerCase()))
    );
  }

  if (filters?.difficulty) {
    filtered = filtered.filter((r) => r.difficulty === filters.difficulty);
  }

  return filtered;
}

/**
 * Get unique topics from all study resources.
 */
export async function getAllTopics(): Promise<string[]> {
  const resources = await prisma.studyResource.findMany({
    select: { topics: true },
  });

  const topicSet = new Set<string>();
  for (const r of resources) {
    r.topics.split(",").forEach((t) => {
      const trimmed = t.trim().toLowerCase();
      if (trimmed) topicSet.add(trimmed);
    });
  }

  return Array.from(topicSet).sort();
}

/**
 * Extract weak topics from a user's completed sessions by analyzing AI evaluations.
 * Returns topics the user scored poorly on.
 */
async function extractWeakTopics(userId: string): Promise<string[]> {
  const sessions = await prisma.session.findMany({
    where: { userId },
    include: {
      problem: { select: { title: true, referenceData: true } },
      steps: {
        where: { aiEvaluation: { not: null } },
        select: { step: true, aiEvaluation: true, passed: true },
      },
    },
  });

  const weakTopics: string[] = [];

  for (const session of sessions) {
    // Extract topics from problem deep dives
    try {
      const ref = JSON.parse(session.problem.referenceData);
      const deepDives = ref.deepDives as { topic: string }[];

      for (const step of session.steps) {
        if (!step.aiEvaluation) continue;
        try {
          const evaluation = JSON.parse(step.aiEvaluation);
          // If score < 70, the related topics are weak areas
          if (evaluation.score < 70) {
            // Add problem-related topics
            for (const dd of deepDives) {
              weakTopics.push(
                dd.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-")
              );
            }

            // Extract keywords from weaknesses
            const weaknesses = evaluation.feedback?.weaknesses as
              | string[]
              | undefined;
            if (weaknesses) {
              for (const w of weaknesses) {
                // Extract meaningful terms from weakness text
                const keywords = w
                  .toLowerCase()
                  .split(/\s+/)
                  .filter((word: string) => word.length > 4)
                  .slice(0, 3);
                weakTopics.push(...keywords);
              }
            }
          }
        } catch {
          // Skip unparseable evaluations
        }
      }
    } catch {
      // Skip unparseable reference data
    }
  }

  return [...new Set(weakTopics)];
}

/**
 * Get recommended study resources based on the user's weak areas from session performance.
 * Returns resources matching weak topics, excluding dismissed ones.
 */
export async function getRecommendedResources(limit = 5) {
  const userId = await getUserId();
  if (!userId) return [];

  const weakTopics = await extractWeakTopics(userId);
  if (weakTopics.length === 0) {
    // If no weak topics (no sessions yet), return beginner-friendly resources
    return prisma.studyResource.findMany({
      where: { difficulty: "BEGINNER" },
      take: limit,
    });
  }

  // Get dismissed resource IDs
  const dismissed = await prisma.dismissedResource.findMany({
    where: { userId },
    select: { resourceId: true },
  });
  const dismissedIds = new Set(dismissed.map((d) => d.resourceId));

  // Get all resources and score them by topic overlap
  const allResources = await prisma.studyResource.findMany();

  const scored = allResources
    .filter((r) => !dismissedIds.has(r.id))
    .map((r) => {
      const tags = r.topics.split(",").map((t) => t.trim().toLowerCase());
      const score = tags.reduce((acc, tag) => {
        const match = weakTopics.some(
          (wt) => tag.includes(wt) || wt.includes(tag)
        );
        return acc + (match ? 1 : 0);
      }, 0);
      return { ...r, relevanceScore: score };
    })
    .filter((r) => r.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  return scored;
}

/**
 * Get resources relevant to a specific problem's topics (for post-session recommendations).
 */
export async function getResourcesForProblem(
  problemId: string,
  limit = 3
) {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
  });
  if (!problem) return [];

  // Extract topic keywords from problem title and deep dives
  const topics: string[] = [];
  topics.push(
    ...problem.title
      .toLowerCase()
      .replace(/^design\s+/i, "")
      .split(/[\s,]+/)
      .filter((t) => t.length > 2)
  );

  try {
    const ref = JSON.parse(problem.referenceData);
    for (const dd of ref.deepDives || []) {
      topics.push(
        dd.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      );
    }
  } catch {
    // ignore
  }

  const allResources = await prisma.studyResource.findMany();

  return allResources
    .map((r) => {
      const tags = r.topics.split(",").map((t) => t.trim().toLowerCase());
      const score = tags.reduce((acc, tag) => {
        const match = topics.some(
          (t) => tag.includes(t) || t.includes(tag)
        );
        return acc + (match ? 1 : 0);
      }, 0);
      return { ...r, relevanceScore: score };
    })
    .filter((r) => r.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);
}

/**
 * Dismiss a resource recommendation so it won't appear again.
 */
export async function dismissResource(resourceId: string) {
  const userId = await getUserId();
  if (!userId) throw new Error("Unauthorized");

  await prisma.dismissedResource.upsert({
    where: { userId_resourceId: { userId, resourceId } },
    update: {},
    create: { userId, resourceId },
  });
}
