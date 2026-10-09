export type AIProviderStatus = {
  enabled: boolean;
  provider: "google_gemini";
  hasKey: boolean;
};

export type AIProviderInput = {
  enabled: boolean;
  provider: "google_gemini";
  apiKey?: string;
  removeKey?: boolean;
};

export const defaultAIProviderStatus: AIProviderStatus = {
  enabled: false, provider: "google_gemini", hasKey: false,
};

export function validAPIKey(value: unknown): value is string {
  return typeof value === "string" && /^[\x21-\x7e]{16,256}$/.test(value.trim());
}
