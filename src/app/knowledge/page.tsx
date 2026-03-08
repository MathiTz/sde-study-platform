import { getKnowledgeEntries } from "@/lib/actions/knowledge";
import { KnowledgeManager } from "./KnowledgeManager";

export default async function KnowledgePage() {
  const entries = await getKnowledgeEntries();

  const serialised = entries.map((e) => ({
    id: e.id,
    sourceUrl: e.sourceUrl,
    title: e.title,
    tags: e.tags,
    summary: (() => {
      try {
        return JSON.parse(e.content).summary as string;
      } catch {
        return "";
      }
    })(),
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scrape web articles to train the AI with additional system design knowledge.
        </p>
      </div>

      <KnowledgeManager initialEntries={serialised} />
    </div>
  );
}
