import type { ActionFailureResult } from "../../messages/action-result.ts";

export const ideaRawTextMaxLength = 2000;

export type IdeaValidationResult =
  | {
      ok: true;
      rawText: string;
    }
  | (ActionFailureResult & {
      code: "idea_text_required" | "idea_text_too_long";
    });

export function validateIdeaRawText(rawText: string): IdeaValidationResult {
  const normalized = rawText.trim();

  if (!normalized) {
    return {
      ok: false,
      code: "idea_text_required",
      message: "Idea text can't be empty.",
      category: "missing_parameter",
      subject: "idea",
      field: "text",
      reason: "required",
    };
  }

  if (normalized.length > ideaRawTextMaxLength) {
    return {
      ok: false,
      code: "idea_text_too_long",
      message: `Idea text must be ${ideaRawTextMaxLength} characters or fewer.`,
      category: "invalid_parameter",
      subject: "idea",
      field: "text",
      reason: "too_long",
      limit: ideaRawTextMaxLength,
    };
  }

  return { ok: true, rawText: normalized };
}
