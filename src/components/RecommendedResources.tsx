"use client";

import { useState, useTransition } from "react";
import { dismissResource } from "@/lib/actions/resources";

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

export function RecommendedResources({
  resources,
  title = "Recommended for You",
  showDismiss = true,
}: {
  resources: Resource[];
  title?: string;
  showDismiss?: boolean;
}) {
  const [items, setItems] = useState(resources);
  const [isPending, startTransition] = useTransition();

  const handleDismiss = (id: string) => {
    startTransition(async () => {
      await dismissResource(id);
      setItems((prev) => prev.filter((r) => r.id !== id));
    });
  };

  if (items.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((resource) => (
          <div
            key={resource.id}
            className="group relative rounded-lg border border-border p-4 transition-colors hover:border-accent/50 hover:bg-muted/30"
          >
            {showDismiss && (
              <button
                onClick={() => handleDismiss(resource.id)}
                disabled={isPending}
                className="absolute right-2 top-2 rounded p-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                title="Dismiss"
              >
                ✕
              </button>
            )}

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

            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-1 block font-medium leading-snug hover:text-accent"
            >
              {resource.title}
            </a>

            <p className="mb-2 line-clamp-2 text-xs text-muted-foreground">
              {resource.description}
            </p>

            <div className="flex flex-wrap gap-1">
              {resource.topics
                .split(",")
                .slice(0, 4)
                .map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {tag.trim()}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
