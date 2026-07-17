import { validateIdeaRawText } from "../idea-validation.ts";
import { PostgresIdeaRepository } from "./postgres-idea-repository.ts";
import type {
  IdeaRecord,
  IdeaRepository,
  IdeaSource,
} from "./idea-repository.ts";

export type CaptureIdeaResult =
  | {
      ok: true;
      code: "idea_captured";
      idea: IdeaRecord;
    }
  | {
      ok: false;
      code:
        | "idea_text_required"
        | "idea_text_too_long"
        | "idea_capture_failed";
      message: string;
    };

export type IdeaServiceOptions = {
  ideas?: IdeaRepository;
  now?: () => Date;
};

export function createIdeaService(options: IdeaServiceOptions = {}) {
  const ideas = options.ideas ?? new PostgresIdeaRepository();
  const now = options.now ?? (() => new Date());

  return {
    async listIdeas(userId: string) {
      return ideas.listUnarchived(userId);
    },

    async captureIdea(input: {
      userId: string;
      rawText: string;
      source: IdeaSource;
      sourceMetadata?: Record<string, unknown>;
    }): Promise<CaptureIdeaResult> {
      const validation = validateIdeaRawText(input.rawText);

      if (!validation.ok) {
        return validation;
      }

      try {
        return {
          ok: true,
          code: "idea_captured",
          idea: await ideas.capture({
            userId: input.userId,
            rawText: validation.rawText,
            source: input.source,
            sourceMetadata: input.sourceMetadata,
            occurredAt: now(),
          }),
        };
      } catch (error) {
        console.error("[ideas]", "capture_failed", {
          userId: input.userId,
          source: input.source,
          errorCode:
            error && typeof error === "object" && "code" in error
              ? String(error.code)
              : "unknown",
        });

        return {
          ok: false,
          code: "idea_capture_failed",
          message: "Idea could not be captured.",
        };
      }
    },
  };
}

export const ideaService = createIdeaService();
