/** Parse a comma-separated tag string into a normalised lowercase array. */
export function parseTags(csv: string): string[] {
  return csv
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

/** Convert a deep-dive topic string to a URL-safe slug. */
export function slugifyTopic(topic: string): string {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Extract searchable topic keywords from a problem title. */
export function extractTopicsFromTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/^design\s+/i, "")
    .split(/[\s,]+/)
    .filter((t) => t.length > 2);
}

/**
 * Rank resources by topic overlap, returning only those with score > 0.
 * Preserves the original resource shape and adds a `relevanceScore` field.
 */
export function rankByTopics<T extends { topics: string }>(
  resources: T[],
  topics: string[],
  limit?: number
): (T & { relevanceScore: number })[] {
  const scored = resources
    .map((r) => {
      const tags = parseTags(r.topics);
      const relevanceScore = tags.reduce(
        (acc, tag) =>
          acc + (topics.some((t) => tag.includes(t) || t.includes(tag)) ? 1 : 0),
        0
      );
      return { ...r, relevanceScore };
    })
    .filter((r) => r.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  return limit ? scored.slice(0, limit) : scored;
}
