export const ideaRawTextMaxLength = 2000;

export type IdeaValidationResult =
  | {
      ok: true;
      rawText: string;
    }
  | {
      ok: false;
      code: "idea_text_required" | "idea_text_too_long";
      message: string;
    };

export function validateIdeaRawText(rawText: string): IdeaValidationResult {
  const normalized = rawText.trim();

  if (!normalized) {
    return {
      ok: false,
      code: "idea_text_required",
      message: "Idea text can't be empty.",
    };
  }

  if (normalized.length > ideaRawTextMaxLength) {
    return {
      ok: false,
      code: "idea_text_too_long",
      message: `Idea text must be ${ideaRawTextMaxLength} characters or fewer.`,
    };
  }

  return { ok: true, rawText: normalized };
}
