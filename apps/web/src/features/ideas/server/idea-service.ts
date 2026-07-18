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

export type SaveIdeaResult =
  | {
      ok: true;
      code: "idea_saved";
      idea: IdeaRecord;
    }
  | {
      ok: false;
      code:
        | "idea_text_required"
        | "idea_text_too_long"
        | "idea_not_found"
        | "idea_save_failed";
      message: string;
    };

export type ArchiveIdeaResult =
  | {
      ok: true;
      code: "idea_archived";
    }
  | {
      ok: false;
      code: "idea_not_found" | "idea_archive_failed";
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
          errorCode: errorCode(error),
        });

        return {
          ok: false,
          code: "idea_capture_failed",
          message: "Idea could not be captured.",
        };
      }
    },

    async saveWebIdea(input: {
      userId: string;
      ideaId?: string;
      rawText: string;
    }): Promise<SaveIdeaResult> {
      const validation = validateIdeaRawText(input.rawText);

      if (!validation.ok) {
        return validation;
      }

      try {
        const idea = input.ideaId
          ? await ideas.update({
              userId: input.userId,
              ideaId: input.ideaId,
              rawText: validation.rawText,
              occurredAt: now(),
            })
          : await ideas.capture({
              userId: input.userId,
              rawText: validation.rawText,
              source: "web",
              occurredAt: now(),
            });

        if (!idea) {
          return {
            ok: false,
            code: "idea_not_found",
            message: "Idea was not found.",
          };
        }

        return {
          ok: true,
          code: "idea_saved",
          idea,
        };
      } catch (error) {
        console.error("[ideas]", "save_failed", {
          userId: input.userId,
          ideaId: input.ideaId ?? null,
          errorCode: errorCode(error),
        });

        return {
          ok: false,
          code: "idea_save_failed",
          message: "Idea could not be saved.",
        };
      }
    },

    async archiveIdea(input: {
      userId: string;
      ideaId: string;
    }): Promise<ArchiveIdeaResult> {
      try {
        const archived = await ideas.archive({
          userId: input.userId,
          ideaId: input.ideaId,
          occurredAt: now(),
        });

        if (!archived) {
          return {
            ok: false,
            code: "idea_not_found",
            message: "Idea was not found.",
          };
        }

        return {
          ok: true,
          code: "idea_archived",
        };
      } catch (error) {
        console.error("[ideas]", "archive_failed", {
          userId: input.userId,
          ideaId: input.ideaId,
          errorCode: errorCode(error),
        });

        return {
          ok: false,
          code: "idea_archive_failed",
          message: "Idea could not be deleted.",
        };
      }
    },
  };
}

export const ideaService = createIdeaService();

function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "unknown";
}
