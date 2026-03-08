"use client";

import { useState, useMemo } from "react";

interface Resource {
  id: string;
  title: string;
  url: string;
  source: string;
  topics: string;
  difficulty: string;
  description: string;
  resourceType: string;
}

const SOURCE_COLORS: Record<string, string> = {
  "O'Reilly": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  Blog: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  GitHub: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  Documentation: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Paper: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  INTERMEDIATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ADVANCED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export function ResourceBrowser({
  resources,
  topics,
}: {
  resources: Resource[];
  topics: string[];
}) {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [search, setSearch] = useState("");

  const sources = useMemo(
    () => [...new Set(resources.map((r) => r.source))].sort(),
    [resources]
  );

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      if (selectedDifficulty && r.difficulty !== selectedDifficulty) return false;
      if (selectedSource && r.source !== selectedSource) return false;
      if (selectedTopic) {
        const tags = r.topics.split(",").map((t) => t.trim().toLowerCase());
        if (!tags.some((t) => t.includes(selectedTopic) || selectedTopic.includes(t)))
          return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.title.toLowerCase().includes(q) &&
          !r.description.toLowerCase().includes(q) &&
          !r.topics.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [resources, selectedTopic, selectedDifficulty, selectedSource, search]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="min-w-[200px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Levels</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d.charAt(0) + d.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {filtered.length} of {resources.length} resources
        </p>
      </div>

      {/* Resource Grid */}
      {filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No resources match the current filters.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-border p-4 transition-colors hover:border-accent/50 hover:bg-muted/30"
            >
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SOURCE_COLORS[resource.source] || "bg-muted text-muted-foreground"}`}
                >
                  {resource.source}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${DIFFICULTY_COLORS[resource.difficulty] || "bg-muted text-muted-foreground"}`}
                >
                  {resource.difficulty.toLowerCase()}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {resource.resourceType.toLowerCase().replace("_", " ")}
                </span>
              </div>

              <h3 className="mb-1 font-medium leading-snug group-hover:text-accent">
                {resource.title}
              </h3>

              <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
                {resource.description}
              </p>

              <div className="flex flex-wrap gap-1">
                {resource.topics
                  .split(",")
                  .slice(0, 5)
                  .map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {tag.trim()}
                    </span>
                  ))}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
