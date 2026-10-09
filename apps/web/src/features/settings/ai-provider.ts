// Keep options in ascending version order, with Lite before Flash within a version.
export const geminiModelOptions = [
  { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite" },
] as const;

export type GeminiModel = typeof geminiModelOptions[number]["value"];
export const defaultAIModel: GeminiModel = "gemini-3.5-flash-lite";

export function validGeminiModel(value: unknown): value is GeminiModel {
  return geminiModelOptions.some(option => option.value === value);
}

export type AIProviderStatus = {
  enabled: boolean;
  provider: "google_gemini";
  hasKey: boolean;
  model: GeminiModel;
};

export type AIProviderInput = {
  enabled: boolean;
  provider: "google_gemini";
  apiKey?: string;
  removeKey?: boolean;
  model?: GeminiModel;
};

export const defaultAIProviderStatus: AIProviderStatus = {
  enabled: false, provider: "google_gemini", hasKey: false, model: defaultAIModel,
};

export function validAPIKey(value: unknown): value is string {
  return typeof value === "string" && /^[\x21-\x7e]{16,256}$/.test(value.trim());
}
