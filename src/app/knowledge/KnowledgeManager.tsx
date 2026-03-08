"use client";

import { useState, useTransition } from "react";
import { scrapeAndSave, deleteKnowledgeEntry } from "@/lib/actions/knowledge";

interface KnowledgeItem {
  id: string;
  sourceUrl: string;
  title: string;
  tags: string;
  summary: string;
  createdAt: string;
}

export function KnowledgeManager({
  initialEntries,
}: {
  initialEntries: KnowledgeItem[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleScrape = () => {
    if (!url.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const entry = await scrapeAndSave(url.trim());
        // Parse the returned entry to match our local shape
        const parsed = JSON.parse(entry.content);
        setEntries((prev) => [
          {
            id: entry.id,
            sourceUrl: entry.sourceUrl,
            title: entry.title,
            tags: entry.tags,
            summary: parsed.summary || "",
            createdAt: entry.createdAt.toISOString(),
          },
          ...prev,
        ]);
        setUrl("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Scraping failed");
      }
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteKnowledgeEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      {/* Scrape form */}
      <div className="rounded-lg border border-border p-4">
        <label className="mb-2 block text-sm font-medium">
          Paste a URL to scrape
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/system-design-article"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            disabled={isPending}
          />
          <button
            onClick={handleScrape}
            disabled={isPending || !url.trim()}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Scraping…" : "Scrape"}
          </button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-danger">{error}</p>
        )}
      </div>

      {/* Entry list */}
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No knowledge entries yet. Scrape some articles to get started.
        </p>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-border p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium truncate">{entry.title}</h3>
                  <a
                    href={entry.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline truncate block"
                  >
                    {entry.sourceUrl}
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={isPending}
                  className="shrink-0 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Delete
                </button>
              </div>

              {entry.tags && (
                <div className="flex flex-wrap gap-1">
                  {entry.tags.split(",").map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              {entry.summary && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {entry.summary}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Added {new Date(entry.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
