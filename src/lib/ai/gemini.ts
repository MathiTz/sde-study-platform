import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "./provider";
import type { AIEvaluation } from "@/lib/types";
import { AI_CONFIG, PROMPT_SEPARATOR, errorFallback } from "./config";
import { parseAIResponse } from "./parse";

export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    this.client = new GoogleGenerativeAI(key);
    this.modelName = modelName || AI_CONFIG.model;
  }

  async evaluate(
    systemPrompt: string,
    userInput: string
  ): Promise<AIEvaluation> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        temperature: AI_CONFIG.temperature,
        responseMimeType: AI_CONFIG.responseMimeType,
      },
    });

    try {
      const prompt = `${systemPrompt}${PROMPT_SEPARATOR}${userInput}`;
      const result = await model.generateContent(prompt);
      return parseAIResponse(result.response.text());
    } catch (error) {
      console.error("Gemini evaluation failed:", error);
      return errorFallback();
    }
  }
}

let _provider: GeminiProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!_provider) {
    _provider = new GeminiProvider();
  }
  return _provider;
}
