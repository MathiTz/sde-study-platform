"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { scrapeUrl } from "@/lib/scraper";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
}

export async function scrapeAndSave(url: string) {
  await requireAuth();

  const knowledge = await scrapeUrl(url);

  const entry = await prisma.knowledgeEntry.create({
    data: {
      sourceUrl: url,
      title: knowledge.title,
      content: knowledge.content,
      tags: knowledge.tags,
    },
  });

  revalidatePath("/knowledge");
  return entry;
}

export async function getKnowledgeEntries() {
  await requireAuth();
  return prisma.knowledgeEntry.findMany({ orderBy: { createdAt: "desc" } });
}

export async function deleteKnowledgeEntry(id: string) {
  await requireAuth();
  await prisma.knowledgeEntry.delete({ where: { id } });
  revalidatePath("/knowledge");
}

/**
 * Query knowledge entries whose tags match any of the given topics.
 * Used by the AI evaluation pipeline to inject relevant knowledge.
 */
export async function getRelevantKnowledge(topics: string[]): Promise<string> {
  if (topics.length === 0) return "";

  const entries = await prisma.knowledgeEntry.findMany();

  // Filter entries whose tags overlap with the requested topics
  const lowerTopics = topics.map((t) => t.toLowerCase());
  const relevant = entries.filter((e) => {
    const entryTags = e.tags.split(",").map((t) => t.trim().toLowerCase());
    return entryTags.some(
      (tag) =>
        lowerTopics.some((topic) => tag.includes(topic) || topic.includes(tag))
    );
  });

  if (relevant.length === 0) return "";

  return relevant
    .map((e) => {
      const parsed = JSON.parse(e.content);
      return `### ${e.title}\nSource: ${e.sourceUrl}\n${parsed.summary}`;
    })
    .join("\n\n");
}
