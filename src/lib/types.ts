export const STEPS = [
  "REQUIREMENTS",
  "CORE_ENTITIES",
  "API_DESIGN",
  "HIGH_LEVEL_DESIGN",
  "DEEP_DIVES",
] as const;

export type Step = (typeof STEPS)[number];

export const STEP_LABELS: Record<Step, string> = {
  REQUIREMENTS: "Requirements",
  CORE_ENTITIES: "Core Entities",
  API_DESIGN: "API Design",
  HIGH_LEVEL_DESIGN: "High-Level Design",
  DEEP_DIVES: "Deep Dives",
};

export const STEP_DURATIONS: Record<Step, number> = {
  REQUIREMENTS: 5,
  CORE_ENTITIES: 2,
  API_DESIGN: 5,
  HIGH_LEVEL_DESIGN: 20,
  DEEP_DIVES: 10,
};

export const STEP_PROMPTS: Record<Step, string> = {
  REQUIREMENTS:
    "Define the functional and non-functional requirements for this system. Think about what users need to do and what quality attributes matter most.",
  CORE_ENTITIES:
    "List the core entities (data models) in this system. Include key fields and relationships between entities.",
  API_DESIGN:
    "Define the API contract for this system. Specify endpoints, HTTP methods, request/response bodies.",
  HIGH_LEVEL_DESIGN:
    "Draw the high-level architecture of the system. Include services, databases, caches, queues, and show the data flow.",
  DEEP_DIVES:
    "Pick 2-3 areas to deep dive into. Discuss scaling challenges, trade-offs, and how you'd address them.",
};

export const RICH_TEXT_STEPS: readonly Step[] = ["CORE_ENTITIES", "API_DESIGN", "DEEP_DIVES"] as const;

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface AIEvaluation {
  score: number;
  feedback: {
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  };
  passed: boolean;
}

export interface ReferenceData {
  requirements: {
    functional: string[];
    nonFunctional: string[];
    keyInsight: string;
  };
  entities: string[];
  api: {
    method: string;
    path: string;
    body?: string;
    response?: string;
    description: string;
  }[];
  architecture: {
    components: string[];
    flow: string[];
    keyDecisions: string[];
  };
  deepDives: {
    topic: string;
    description: string;
    expectedPoints: string[];
  }[];
  rubric: Record<
    Step,
    {
      passing: number;
      criteria: string[];
    }
  >;
}

export function getNextStep(current: Step): Step | "COMPLETED" {
  const idx = STEPS.indexOf(current);
  if (idx === STEPS.length - 1) return "COMPLETED";
  return STEPS[idx + 1];
}

export function parseReferenceData(json: string): ReferenceData {
  return JSON.parse(json) as ReferenceData;
}
