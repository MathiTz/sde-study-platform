"use client";

import { useState, useMemo } from "react";
import { ResourceCard, type Resource } from "@/components/ResourceCard";
import { parseTags } from "@/lib/utils/tags";

const DIFFICULTIES = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export function ResourceBrowser({
  resources,
  topics,
}: {
  resources: Resource[];
  topics: string[];
}) {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
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
        const tags = parseTags(r.topics);
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
            className="min-w-50 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
            <ResourceCard key={resource.id} resource={resource} maxTopicTags={5} />
          ))}
        </div>
      )}
    </div>
  );
}
