import { AIEvaluation } from "@/lib/types";

export interface AIProvider {
  evaluate(systemPrompt: string, userInput: string): Promise<AIEvaluation>;
}
