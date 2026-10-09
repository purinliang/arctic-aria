import { GoogleGenAI } from "@google/genai/node";
import type { GenerateContentParameters, GenerateContentResponse } from "@google/genai/node";
import { geminiConfig, geminiConnectionTestPrompt } from "./gemini-config.ts";
import { connectionTestErrorResponse } from "./connection-test-diagnostics.ts";

type Generator = (input: GenerateContentParameters) => Promise<GenerateContentResponse>;
export type GeminiTurn = { role: 'user' | 'model'; text: string };
type GeminiErrorCode = "invalid_input" | "request_failed" | "empty_response" | "network_failure" | "timeout";

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

export function createGeminiClient({ env = process.env, generate, logConnectionTestErrors = false }: {
  env?: Record<string, string | undefined>;
  generate?: Generator;
  logConnectionTestErrors?: boolean;
} = {}) {
  const config = geminiConfig(env);
  const sdk = generate ? null : new GoogleGenAI({
    apiKey: config.apiKey,
    vertexai: false,
    httpOptions: { timeout: 30_000, retryOptions: { attempts: 1 } },
  });
  const request = generate ?? ((input: GenerateContentParameters) => sdk!.models.generateContent(input));

  async function generateReply(contents: GenerateContentParameters['contents'], connectionTest = false) {
    try {
      const response = await request({ model: config.model, contents, config: {
        maxOutputTokens: 1_024,
        ...(config.model.startsWith('gemini-2.5-') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
      } });
      const text = response.text?.trim();
      if (!text) throw new GeminiError('empty_response');
      return { text, model: config.model };
    } catch (error) {
      const status = error && typeof error === 'object' && 'status' in error && typeof error.status === 'number'
        && Number.isInteger(error.status) && error.status >= 100 && error.status <= 599 ? error.status : undefined;
      const name = error instanceof Error ? error.name : '';
      const code = name === 'TimeoutError' || name === 'AbortError' ? 'timeout'
        : name === 'TypeError' && status === undefined ? 'network_failure' : 'request_failed';
      const failure = error instanceof GeminiError ? error : new GeminiError(code, status);
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Gemini] generateContent failed', { model: config.model, status: failure.status ?? null, code: failure.code });
        if (logConnectionTestErrors && connectionTest) {
          const response = connectionTestErrorResponse(error, config.apiKey);
          if (response) console.warn('[Gemini] provider error response (redacted)', response);
        }
      }
      throw failure;
    }
  }

  return {
    async generateText(prompt: string) {
      if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 8_000) {
        throw new GeminiError("invalid_input");
      }
      return generateReply(prompt.trim(), prompt.trim() === geminiConnectionTestPrompt);
    },
    async generateConversation(turns: GeminiTurn[]) {
      if (!Array.isArray(turns) || !turns.length || turns.length > 17 || turns.at(-1)?.role !== 'user'
        || turns.some((turn, index) => !turn || turn.role !== (index % 2 === 0 ? 'user' : 'model')
          || typeof turn.text !== 'string' || !turn.text.trim() || turn.text.length > 16000)) throw new GeminiError('invalid_input');
      const result = await generateReply(turns.map(turn => ({ role: turn.role, parts: [{ text: turn.text }] })));
      if (result.text.length > 16000) throw new GeminiError('invalid_input');
      return result;
    },
  };
}
