export type SupportedLanguage = "en" | "zh-CN";
export type LanguagePreference = "system" | SupportedLanguage;

export const defaultLanguage: SupportedLanguage = "en";

export function readLanguagePreference(value: string | null): LanguagePreference {
  if (value === "system" || value === "en" || value === "zh-CN") {
    return value;
  }

  return "system";
}

export function resolveLanguage(
  preference: LanguagePreference,
  browserLanguage: SupportedLanguage,
): SupportedLanguage {
  if (preference === "system") {
    return browserLanguage;
  }

  return preference;
}
