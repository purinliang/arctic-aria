import { GoogleGenAI } from "@google/genai/node";
import type { GenerateContentParameters, GenerateContentResponse } from "@google/genai/node";
import { geminiConfig } from "./gemini-config.ts";

type Generator = (input: GenerateContentParameters) => Promise<GenerateContentResponse>;
type GeminiErrorCode = "invalid_input" | "request_failed" | "empty_response";

export class GeminiError extends Error {
  readonly code: GeminiErrorCode;
  readonly status?: number;

  constructor(code: GeminiErrorCode, status?: number) {
    super(`Gemini ${code}.`);
    this.name = "GeminiError";
    this.code = code;
    this.status = status;
  }
}

export function createGeminiClient({ env = process.env, generate }: {
  env?: Record<string, string | undefined>;
  generate?: Generator;
} = {}) {
  const config = geminiConfig(env);
  const sdk = generate ? null : new GoogleGenAI({
    apiKey: config.apiKey,
    vertexai: false,
    httpOptions: { timeout: 30_000, retryOptions: { attempts: 1 } },
  });
  const request = generate ?? ((input: GenerateContentParameters) => sdk!.models.generateContent(input));

  return {
    async generateText(prompt: string) {
      if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 8_000) {
        throw new GeminiError("invalid_input");
      }
      try {
        const response = await request({
          model: config.model,
          contents: prompt.trim(),
          config: {
            maxOutputTokens: 1_024,
            ...(config.model.startsWith("gemini-2.5-") ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
          },
        });
        const text = response.text?.trim();
        if (!text) throw new GeminiError("empty_response");
        return { text, model: config.model };
      } catch (error) {
        if (error instanceof GeminiError) throw error;
        // Provider errors can contain credentials or request content; do not retain them.
        const status = error && typeof error === "object" && "status" in error && typeof error.status === "number"
          ? error.status : undefined;
        throw new GeminiError("request_failed", status);
      }
    },
  };
}
