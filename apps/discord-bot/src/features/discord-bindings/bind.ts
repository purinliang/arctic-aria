import { createHash } from "node:crypto";
import type { QueryExecutor } from "../../infrastructure/query-executor.ts";

const discordSnowflakePattern = /^[0-9]{5,32}$/;

export type DiscordAccountBindInput = {
  discordUserId: string;
  discordUsername: string | null;
  dmChannelId: string | null;
  rawCode: string;
  occurredAt: Date;
};

export type DiscordAccountBindResult =
  | {
      ok: true;
      code: "discord_account_bound";
      reply: string;
    }
  | {
      ok: false;
      code:
        | "discord_user_invalid"
        | "discord_binding_code_required"
        | "discord_binding_code_invalid"
        | "discord_account_claimed"
        | "discord_binding_failed";
      reply: string;
    };

type BindingRow = {
  user_id: string;
};

export function normalizeDiscordBindingCode(input: string) {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function hashDiscordBindingCode(input: string) {
  return createHash("sha256")
    .update(normalizeDiscordBindingCode(input), "utf8")
    .digest("hex");
}

export async function bindDiscordAccount(
  sql: QueryExecutor,
  input: DiscordAccountBindInput,
): Promise<DiscordAccountBindResult> {
  if (!discordSnowflakePattern.test(input.discordUserId)) {
    return {
      ok: false,
      code: "discord_user_invalid",
      reply: "This Discord account id is invalid.",
    };
  }

  const normalizedCode = normalizeDiscordBindingCode(input.rawCode);

  if (normalizedCode.length === 0) {
    return {
      ok: false,
      code: "discord_binding_code_required",
      reply: "Please include the connection code from Settings.",
    };
  }

  try {
    const rows = (await sql.query(
      `WITH valid_code AS (
         SELECT id, user_id
         FROM discord_binding_codes
         WHERE code_hash = $1
           AND consumed_at IS NULL
           AND expires_at > $5
         ORDER BY created_at DESC
         LIMIT 1
       ),
       consumed_code AS (
         UPDATE discord_binding_codes
         SET consumed_at = $5
         WHERE id IN (SELECT id FROM valid_code)
         RETURNING user_id
       )
       INSERT INTO discord_accounts (
         user_id,
         discord_user_id,
         discord_username,
         dm_channel_id,
         binding_status,
         last_interaction_at,
         created_at,
         updated_at,
         revoked_at
       )
       SELECT
         user_id,
         $2,
         $3,
         $4,
         'active',
         $5,
         $5,
         $5,
         NULL
       FROM consumed_code
       ON CONFLICT (user_id) DO UPDATE SET
         discord_user_id = EXCLUDED.discord_user_id,
         discord_username = EXCLUDED.discord_username,
         dm_channel_id = EXCLUDED.dm_channel_id,
         binding_status = 'active',
         last_interaction_at = EXCLUDED.last_interaction_at,
         updated_at = EXCLUDED.updated_at,
         revoked_at = NULL
       RETURNING user_id`,
      [
        hashDiscordBindingCode(normalizedCode),
        input.discordUserId,
        input.discordUsername,
        input.dmChannelId,
        input.occurredAt,
      ],
    )) as BindingRow[];

    if (!rows[0]) {
      return {
        ok: false,
        code: "discord_binding_code_invalid",
        reply: "This connection code is invalid or expired.",
      };
    }

    return {
      ok: true,
      code: "discord_account_bound",
      reply: "Discord connected to Arctic Aria.",
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        code: "discord_account_claimed",
        reply:
          "This Discord account is already linked to another Arctic Aria account.",
      };
    }

    console.error("[discord-bot]", "discord_binding_failed", {
      discordUserId: input.discordUserId,
      errorCode:
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "unknown",
    });

    return {
      ok: false,
      code: "discord_binding_failed",
      reply: "Discord could not be connected.",
    };
  }
}

function isUniqueViolation(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505",
  );
}
