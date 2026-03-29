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

export const COMPLETED_STEP = "COMPLETED" as const;
export type CompletedStep = typeof COMPLETED_STEP;

export const SESSION_STATUSES = ["ACTIVE", "PAUSED", "COMPLETED"] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export const DIFFICULTY_ORDER: Record<Difficulty, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };

export const PASSING_SCORE_THRESHOLD = 60;
export const WEEK_PASSING_SCORE_THRESHOLD = 75;

export interface AuthUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// ─── Requirements ──────────────────────────────────────────────

export interface RequirementsData {
  functional: string[];
  nonFunctional: string[];
  estimation: {
    dau: string;
    readWriteRatio: string;
    avgPayloadKB: string;
  };
}

export function serializeRequirements(data: RequirementsData): string {
  return JSON.stringify(data);
}

export function deserializeRequirements(raw: string): RequirementsData | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.functional && parsed.nonFunctional) return parsed as RequirementsData;
    return null;
  } catch {
    return null;
  }
}

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

// ─── Study Plan Types ──────────────────────────────────────────

export type QuestionType = "SINGLE" | "MULTIPLE" | "ABSTRACT" | "DRAWING";

export interface StudyPlan {
  id: string;
  title: string;
  description: string;
  duration: number;
  isActive: boolean;
  weeks: StudyWeek[];
}

export interface StudyWeek {
  id: string;
  weekNumber: number;
  title: string;
  description: string;
  topics: string;
  lessonId: string | null;
  isCompleted: boolean;
  isLocked: boolean;
  questions: StudyQuestion[];
  progress?: WeekProgress | null;
}

export interface StudyQuestion {
  id: string;
  questionType: QuestionType;
  question: string;
  options: QuestionOption[] | null;
  hint: string | null;
  explanation: string | null;
  topic: string;
  difficulty: string;
  attempts: QuestionAttempt[];
}

export interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

export interface QuestionAttempt {
  id: string;
  userAnswer: string;
  isCorrect: boolean | null;
  score: number | null;
  aiFeedback: AIFeedback | null;
  createdAt: string;
}

export interface AIFeedback {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface WeekProgress {
  id: string;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  attemptsCount: number;
}

export interface UserLessonProgress {
  id: string;
  lessonId: string;
  readAt: string;
}
