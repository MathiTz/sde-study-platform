"use server";

import { prisma } from "@/lib/prisma";
import { tryGetAuthUserId } from "@/lib/auth";
import { PASSING_SCORE_THRESHOLD } from "@/lib/types";
import { parseTags, extractTopicsFromTitle, slugifyTopic, rankByTopics } from "@/lib/utils/tags";
import { safeParseEvaluation } from "@/lib/utils/json";

export async function getAllResources(filters?: {
  topic?: string;
  difficulty?: string;
}) {
  const resources = await prisma.studyResource.findMany({
    orderBy: { createdAt: "desc" },
  });

  return resources.filter((r) => {
    if (filters?.difficulty && r.difficulty !== filters.difficulty) return false;
    if (filters?.topic) {
      const t = filters.topic.toLowerCase();
      const tags = parseTags(r.topics);
      if (!tags.some((tag) => tag.includes(t) || t.includes(tag))) return false;
    }
    return true;
  });
}

export async function getAllTopics(): Promise<string[]> {
  const resources = await prisma.studyResource.findMany({
    select: { topics: true },
  });

  const topicSet = new Set<string>();
  for (const r of resources) {
    parseTags(r.topics).forEach((t) => topicSet.add(t));
  }

  return Array.from(topicSet).sort();
}

async function extractWeakTopics(userId: string): Promise<string[]> {
  const sessions = await prisma.session.findMany({
    where: { userId },
    include: {
      problem: { select: { title: true, referenceData: true } },
      steps: {
        where: { aiEvaluation: { not: null } },
        select: { aiEvaluation: true },
      },
    },
  });

  const weakTopics: string[] = [];

  for (const session of sessions) {
    try {
      const ref = JSON.parse(session.problem.referenceData);
      const deepDives = (ref.deepDives ?? []) as { topic: string }[];

      for (const step of session.steps) {
        const evaluation = safeParseEvaluation(step.aiEvaluation);
        if (!evaluation || evaluation.score >= PASSING_SCORE_THRESHOLD) continue;

        weakTopics.push(...deepDives.map((dd) => slugifyTopic(dd.topic)));

        const weaknesses = evaluation.feedback?.weaknesses ?? [];
        for (const w of weaknesses) {
          weakTopics.push(
            ...w
              .toLowerCase()
              .split(/\s+/)
              .filter((word) => word.length > 4)
              .slice(0, 3)
          );
        }
      }
    } catch {
      // Skip sessions with unparseable reference data
    }
  }

  return [...new Set(weakTopics)];
}

export async function getRecommendedResources(limit = 5) {
  const userId = await tryGetAuthUserId();
  if (!userId) return [];

  const weakTopics = await extractWeakTopics(userId);
  if (weakTopics.length === 0) {
    return prisma.studyResource.findMany({
      where: { difficulty: "BEGINNER" },
      take: limit,
    });
  }

  const dismissed = await prisma.dismissedResource.findMany({
    where: { userId },
    select: { resourceId: true },
  });
  const dismissedIds = new Set(dismissed.map((d) => d.resourceId));

  const allResources = await prisma.studyResource.findMany();
  const eligible = allResources.filter((r) => !dismissedIds.has(r.id));

  return rankByTopics(eligible, weakTopics, limit);
}

export async function getResourcesForProblem(problemId: string, limit = 3) {
  const problem = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!problem) return [];

  const topics = extractTopicsFromTitle(problem.title);

  try {
    const ref = JSON.parse(problem.referenceData);
    for (const dd of ref.deepDives ?? []) {
      topics.push(slugifyTopic(dd.topic));
    }
  } catch {
    // ignore unparseable reference data
  }

  const allResources = await prisma.studyResource.findMany();
  return rankByTopics(allResources, topics, limit);
}

export async function dismissResource(resourceId: string) {
  const userId = await tryGetAuthUserId();
  if (!userId) throw new Error("Unauthorized");

  await prisma.dismissedResource.upsert({
    where: { userId_resourceId: { userId, resourceId } },
    update: {},
    create: { userId, resourceId },
  });
}
