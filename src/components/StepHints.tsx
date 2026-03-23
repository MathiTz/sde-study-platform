"use client";

import { useState } from "react";
import { Step, ReferenceData } from "@/lib/types";

const STATIC_HINTS: Record<Step, string[]> = {
  REQUIREMENTS: [
    "Think about 3 core functional requirements",
    "Consider: CAP theorem, scalability, latency, durability",
  ],
  CORE_ENTITIES: [
    "Who are the actors in the system?",
    "What nouns/resources are needed to satisfy the requirements?",
    "Keep it simple — you'll refine during high-level design",
  ],
  API_DESIGN: [
    "Map functional requirements to endpoints",
    "Use REST by default (POST, GET, PUT, DELETE)",
    "Consider pagination, authentication, rate limiting",
  ],
  HIGH_LEVEL_DESIGN: [
    "Start with the client and work your way to the data store",
    "Include: load balancers, services, databases, caches, queues",
    "Show the data flow for each core use case",
  ],
  DEEP_DIVES: [
    "Pick 2-3 interesting areas to go deep on",
    "Discuss trade-offs, not just solutions",
    "Consider: scaling bottlenecks, failure modes, data consistency",
  ],
};

interface StepHintsProps {
  step: Step;
  referenceData: ReferenceData;
}

export function StepHints({ step, referenceData }: StepHintsProps) {
  const [showHints, setShowHints] = useState(false);

  const hints =
    step === "REQUIREMENTS"
      ? [
          ...STATIC_HINTS.REQUIREMENTS,
          `Key insight: ${referenceData.requirements.keyInsight}`,
        ]
      : STATIC_HINTS[step];

  return (
    <div className="rounded-lg border border-dashed border-border">
      <button
        onClick={() => setShowHints((s) => !s)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
      >
        <span>💡 Hints</span>
        <span>{showHints ? "▲" : "▼"}</span>
      </button>
      {showHints && (
        <ul className="space-y-1.5 border-t border-dashed border-border px-4 py-3">
          {hints.map((hint, i) => (
            <li key={i} className="text-sm text-muted-foreground">
              • {hint}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
