"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { scrapeUrl } from "@/lib/scraper";
import { revalidatePath } from "next/cache";
import { parseTags } from "@/lib/utils/tags";

export async function scrapeAndSave(url: string) {
  await getAuthUser();

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
  await getAuthUser();
  return prisma.knowledgeEntry.findMany({ orderBy: { createdAt: "desc" } });
}

export async function deleteKnowledgeEntry(id: string) {
  await getAuthUser();
  await prisma.knowledgeEntry.delete({ where: { id } });
  revalidatePath("/knowledge");
}

/**
 * Return a formatted knowledge context string for entries whose tags
 * overlap with the given topics. Used by the AI evaluation pipeline.
 */
export async function getRelevantKnowledge(topics: string[]): Promise<string> {
  if (topics.length === 0) return "";

  const entries = await prisma.knowledgeEntry.findMany();
  const lowerTopics = topics.map((t) => t.toLowerCase());

  const relevant = entries.filter((e) => {
    const entryTags = parseTags(e.tags);
    return entryTags.some((tag) =>
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
