import type { QueryExecutor } from "./query-executor.ts";

const discordSnowflakePattern = /^[0-9]{5,32}$/;

export type DeveloperBindingInput = {
  discordUserId: string | null;
  developerUsername: string | null;
  occurredAt: Date;
};

export type DeveloperBindingResult =
  | {
      ok: true;
      code: "developer_binding_ready";
      userId: string;
    }
  | {
      ok: false;
      code:
        | "developer_binding_not_configured"
        | "developer_discord_user_invalid"
        | "developer_user_not_found"
        | "developer_binding_failed";
      message: string;
    };

type UserRow = {
  id: string;
};

export async function ensureDeveloperDiscordBinding(
  sql: QueryExecutor,
  input: DeveloperBindingInput,
): Promise<DeveloperBindingResult> {
  if (!input.discordUserId || !input.developerUsername) {
    return {
      ok: false,
      code: "developer_binding_not_configured",
      message:
        "Developer Discord binding skipped because prototype binding env variables are not configured.",
    };
  }

  if (!discordSnowflakePattern.test(input.discordUserId)) {
    return {
      ok: false,
      code: "developer_discord_user_invalid",
      message: "DISCORD_DEVELOPER_USER_ID is not a valid Discord snowflake id.",
    };
  }

  const userRows = (await sql.query(
    `SELECT id
     FROM users
     WHERE username = $1
     LIMIT 1`,
    [input.developerUsername],
  )) as UserRow[];

  const user = userRows[0];

  if (!user) {
    return {
      ok: false,
      code: "developer_user_not_found",
      message: "Configured Arctic Aria developer username was not found.",
    };
  }

  try {
    await sql.query(
      `INSERT INTO discord_accounts (
         user_id,
         discord_user_id,
         binding_status,
         last_interaction_at,
         created_at,
         updated_at,
         revoked_at
       )
       VALUES ($1, $2, 'active', $3, $3, $3, NULL)
       ON CONFLICT (user_id) DO UPDATE SET
         discord_user_id = EXCLUDED.discord_user_id,
         binding_status = 'active',
         last_interaction_at = EXCLUDED.last_interaction_at,
         updated_at = EXCLUDED.updated_at,
         revoked_at = NULL`,
      [user.id, input.discordUserId, input.occurredAt],
    );

    return {
      ok: true,
      code: "developer_binding_ready",
      userId: user.id,
    };
  } catch (error) {
    console.error("[discord-bot]", "developer_binding_failed", {
      developerUsername: input.developerUsername,
      errorCode:
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "unknown",
    });

    return {
      ok: false,
      code: "developer_binding_failed",
      message: "Developer Discord binding failed.",
    };
  }
}
