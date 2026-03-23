"use client";

import { useState, useTransition } from "react";
import { dismissResource } from "@/lib/actions/resources";
import { ResourceCard, type Resource } from "./ResourceCard";

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
          <ResourceCard
            key={resource.id}
            resource={resource}
            maxTopicTags={4}
            onDismiss={showDismiss ? handleDismiss : undefined}
            dismissDisabled={isPending}
          />
        ))}
      </div>
    </section>
  );
}
