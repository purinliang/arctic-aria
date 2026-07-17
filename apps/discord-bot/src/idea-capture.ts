import type { QueryExecutor } from "./query-executor.ts";

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
        | "discord_user_invalid"
        | "discord_account_not_bound"
        | "idea_text_required"
        | "idea_text_too_long"
        | "idea_capture_failed";
      reply: string;
    };

type DiscordAccountRow = {
  user_id: string;
};

type IdeaRow = {
  id: string;
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
  sql: QueryExecutor,
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

  const bindingRows = (await sql.query(
    `SELECT user_id
     FROM discord_accounts
     WHERE discord_user_id = $1
       AND binding_status = 'active'
     LIMIT 1`,
    [input.discordUserId],
  )) as DiscordAccountRow[];

  const binding = bindingRows[0];

  if (!binding) {
    return {
      ok: false,
      code: "discord_account_not_bound",
      reply:
        "This Discord account is not linked to Arctic Aria yet. Open the web app settings before using /idea.",
    };
  }

  try {
    const sourceMetadata = {
      discordUserId: input.discordUserId,
      discordUsername: input.discordUsername,
      dmChannelId: input.dmChannelId,
    };

    const ideaRows = (await sql.query(
      `INSERT INTO ideas (
         user_id,
         raw_text,
         source,
         triage_status,
         source_metadata,
         created_at,
         updated_at
       )
       VALUES ($1, $2, 'discord', 'untriaged', $3::jsonb, $4, $4)
       RETURNING id`,
      [
        binding.user_id,
        validation.text,
        JSON.stringify(sourceMetadata),
        input.occurredAt,
      ],
    )) as IdeaRow[];

    await sql.query(
      `UPDATE discord_accounts
       SET last_interaction_at = $2,
           discord_username = COALESCE($3, discord_username),
           dm_channel_id = COALESCE($4, dm_channel_id),
           updated_at = $2
       WHERE discord_user_id = $1
         AND binding_status = 'active'`,
      [
        input.discordUserId,
        input.occurredAt,
        input.discordUsername,
        input.dmChannelId,
      ],
    );

    return {
      ok: true,
      code: "idea_captured",
      ideaId: ideaRows[0].id,
      reply: "Idea captured.",
    };
  } catch (error) {
    console.error("[discord-bot]", "idea_capture_failed", {
      discordUserId: input.discordUserId,
      errorCode:
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "unknown",
    });

    return {
      ok: false,
      code: "idea_capture_failed",
      reply: "Idea could not be captured.",
    };
  }
}
