export const defaultGeminiModel = "gemini-2.5-flash";

export class GeminiConfigError extends Error {}

export function geminiConfig(env: Record<string, string | undefined> = process.env) {
  if (typeof window !== "undefined") throw new GeminiConfigError("Gemini is server-only.");
  const apiKey = env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new GeminiConfigError("Set GEMINI_API_KEY in the server environment.");
  const model = env.GEMINI_MODEL?.trim() || defaultGeminiModel;
  if (!/^gemini-[a-z0-9.-]+$/.test(model)) throw new GeminiConfigError("Invalid GEMINI_MODEL.");
  return { apiKey, model };
}
