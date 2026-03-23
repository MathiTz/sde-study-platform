import { Step, ReferenceData } from "@/lib/types";
import { getRelevantKnowledge } from "@/lib/actions/knowledge";
import { MAX_KNOWLEDGE_CHARS } from "./config";
import { htmlToAIText } from "@/lib/utils/html";
import { extractTopicsFromTitle } from "@/lib/utils/tags";

/**
 * Compact system prompt — no framework overview (AI only sees one step).
 * JSON format enforced via responseMimeType in the provider.
 */
const SYSTEM_PROMPT = `You evaluate system design interview answers. Be constructive. No single right answer exists — evaluate how well choices fit the problem. Reward reasoning and trade-offs over memorized answers.

Respond JSON: {"score":0-100,"feedback":{"strengths":[],"weaknesses":[],"suggestions":[]},"passed":bool}
Keep each item 1-2 sentences, 2-4 items per category.`;

/**
 * Build the full prompt for a specific step evaluation.
 * Combines the framework system prompt + problem-specific reference + rubric.
 */
export async function buildEvaluationPrompt(
  step: Step,
  problemTitle: string,
  referenceData: ReferenceData
): Promise<string> {
  const rubric = referenceData.rubric[step];
  const stepRef = getStepReference(step, referenceData);

  const topics = extractTopicsFromTitle(problemTitle);

  let knowledge = await getRelevantKnowledge(topics);
  if (knowledge.length > MAX_KNOWLEDGE_CHARS) {
    knowledge = knowledge.slice(0, MAX_KNOWLEDGE_CHARS) + "…";
  }
  const knowledgePart = knowledge ? `\nContext:\n${knowledge}` : "";

  return `${SYSTEM_PROMPT}\n---\nProblem: ${problemTitle} | Step: ${step.replace(/_/g, " ")}\nPass: ${rubric.passing}/100\nCriteria: ${rubric.criteria.join("; ")}\nReference:\n${stepRef}${knowledgePart}`;
}

/**
 * Get step-specific reference material from the problem's reference data.
 */
function getStepReference(step: Step, ref: ReferenceData): string {
  switch (step) {
    case "REQUIREMENTS":
      return `FR: ${ref.requirements.functional.join("; ")}
NFR: ${ref.requirements.nonFunctional.join("; ")}
Insight: ${ref.requirements.keyInsight}`;

    case "CORE_ENTITIES":
      return `Entities: ${ref.entities.join("; ")}`;

    case "API_DESIGN":
      return ref.api.map((a) => `${a.method} ${a.path} — ${a.description}`).join("\n");

    case "HIGH_LEVEL_DESIGN":
      return `Components: ${ref.architecture.components.join("; ")}
Flow: ${ref.architecture.flow.join("; ")}
Decisions: ${ref.architecture.keyDecisions.join("; ")}`;

    case "DEEP_DIVES":
      return ref.deepDives
        .map((dd) => `${dd.topic}: ${dd.expectedPoints.join("; ")}`)
        .join("\n");
  }
}

/**
 * Extract a text description from Excalidraw scene JSON.
 * Converts diagram elements into a structured text representation
 * so the LLM can evaluate the architecture without seeing raw JSON.
 */
export function excalidrawSceneToText(sceneJson: string): string {
  try {
    const elements = JSON.parse(sceneJson);
    if (!Array.isArray(elements) || elements.length === 0) return "(empty)";

    const labels: string[] = [];
    const connections: string[] = [];

    for (const el of elements) {
      if (el.isDeleted) continue;
      const label = el.text?.trim() || el.label?.trim();
      if (el.type === "text" && el.text) {
        labels.push(el.text.trim());
      } else if (el.type === "arrow" || el.type === "line") {
        if (label) connections.push(label);
      } else if (label) {
        labels.push(label);
      }
    }

    const parts: string[] = [];
    if (labels.length) parts.push(`Components: ${labels.join(", ")}`);
    if (connections.length) parts.push(`Connections: ${connections.join(", ")}`);
    return parts.join("\n") || "(no labels)";
  } catch {
    return "(parse error)";
  }
}

/**
 * Prepare user input for AI evaluation — minimize tokens.
 * Strips HTML tags, compresses whitespace, formats structured data concisely.
 */
export function prepareUserInput(step: Step, rawInput: string): string {
  if (step === "REQUIREMENTS") return prepareRequirementsInput(rawInput);
  if (step === "HIGH_LEVEL_DESIGN") return prepareHLDInput(rawInput);
  // CORE_ENTITIES, API_DESIGN, DEEP_DIVES — strip HTML to plain text
  return htmlToAIText(rawInput);
}

function prepareRequirementsInput(rawInput: string): string {
  try {
    const parsed = JSON.parse(rawInput);
    if (!parsed.functional && !parsed.nonFunctional) return rawInput;

    const parts: string[] = [];
    const fr = (parsed.functional as string[]).filter((f: string) => f.trim());
    if (fr.length) parts.push(`FR: ${fr.join("; ")}`);

    const nfr = (parsed.nonFunctional as string[]).filter((f: string) => f.trim());
    if (nfr.length) parts.push(`NFR: ${nfr.join("; ")}`);

    const est = parsed.estimation;
    if (est?.dau || est?.readWriteRatio || est?.avgPayloadKB) {
      const e: string[] = [];
      if (est.dau) e.push(`DAU:${est.dau}`);
      if (est.readWriteRatio) e.push(`R/W:${est.readWriteRatio}:1`);
      if (est.avgPayloadKB) e.push(`Payload:${est.avgPayloadKB}KB`);
      parts.push(`Est: ${e.join(", ")}`);
    }

    return parts.join("\n") || rawInput;
  } catch {
    return rawInput;
  }
}

function prepareHLDInput(rawInput: string): string {
  try {
    const parsed = JSON.parse(rawInput);
    const diagram = parsed.diagram
      ? excalidrawSceneToText(parsed.diagram)
      : "(empty)";
    const notes = parsed.notes?.trim() || "";
    return notes ? `Diagram:\n${diagram}\nNotes:\n${notes}` : `Diagram:\n${diagram}`;
  } catch {
    return rawInput;
  }
}
