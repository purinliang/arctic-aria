import type { PostgresDiscordAccountRepository } from "../../../server/discord/discord-account-repository.ts";
import type { PostgresIdeaRepository } from "../../ideas/server/postgres-idea-repository.ts";

export const ideaTextMaxLength = 2000;

const discordSnowflakePattern = /^[0-9]{5,32}$/;

export type DiscordIdeaCaptureInput = {
  discordUserId: string;
  discordUsername: string | null;
  dmChannelId: string | null;
  rawText: string;
  occurredAt: Date;
};

export type DiscordIdeaCaptureResult =
  | {
      ok: true;
      code: "idea_captured";
      ideaId: string;
      reply: string;
    }
  | {
      ok: false;
      code:
        | "discord_account_not_bound"
        | "discord_user_invalid"
        | "idea_capture_failed"
        | "idea_text_required"
        | "idea_text_too_long";
      reply: string;
    };

export function validateDiscordIdeaText(rawText: string) {
  const text = rawText.trim();

  if (text.length === 0) {
    return {
      ok: false as const,
      code: "idea_text_required" as const,
      reply: "Please include idea text.",
    };
  }

  if (text.length > ideaTextMaxLength) {
    return {
      ok: false as const,
      code: "idea_text_too_long" as const,
      reply: `Ideas must be ${ideaTextMaxLength} characters or fewer.`,
    };
  }

  return {
    ok: true as const,
    text,
  };
}

export async function captureDiscordIdea(
  repositories: {
    discordAccounts: Pick<
      PostgresDiscordAccountRepository,
      "findActiveByDiscordUserId" | "recordInteraction"
    >;
    ideas: Pick<PostgresIdeaRepository, "capture">;
  },
  input: DiscordIdeaCaptureInput,
): Promise<DiscordIdeaCaptureResult> {
  if (!discordSnowflakePattern.test(input.discordUserId)) {
    return {
      ok: false,
      code: "discord_user_invalid",
      reply: "This Discord account id is invalid.",
    };
  }

  const validation = validateDiscordIdeaText(input.rawText);

  if (!validation.ok) {
    return validation;
  }

  const binding = await repositories.discordAccounts.findActiveByDiscordUserId(
    input.discordUserId,
  );

  if (!binding) {
    return {
      ok: false,
      code: "discord_account_not_bound",
      reply:
        "This Discord account is not linked to Arctic Aria yet. Open the web app settings before using /idea.",
    };
  }

  try {
    const idea = await repositories.ideas.capture({
      userId: binding.userId,
      rawText: validation.text,
      source: "discord",
      sourceMetadata: {
        discordUserId: input.discordUserId,
        discordUsername: input.discordUsername,
        dmChannelId: input.dmChannelId,
      },
      occurredAt: input.occurredAt,
    });

    await repositories.discordAccounts.recordInteraction({
      discordUserId: input.discordUserId,
      discordUsername: input.discordUsername,
      dmChannelId: input.dmChannelId,
      occurredAt: input.occurredAt,
    });

    return {
      ok: true,
      code: "idea_captured",
      ideaId: idea.id,
      reply: "Idea captured.",
    };
  } catch (error) {
    console.error("[discord-web]", "idea_capture_failed", {
      discordUserId: input.discordUserId,
      errorCode: readErrorCode(error),
    });

    return {
      ok: false,
      code: "idea_capture_failed",
      reply: "Idea could not be captured.",
    };
  }
}

function readErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "unknown";
}
