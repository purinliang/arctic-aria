import type { PostgresDiscordAccountRepository } from "../../../server/discord/discord-account-repository.ts";
import {
  hashDiscordBindingCode,
  normalizeDiscordBindingCode,
} from "../../settings/server/discord-binding-code.ts";

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
        | "discord_account_claimed"
        | "discord_binding_code_invalid"
        | "discord_binding_code_required"
        | "discord_binding_failed"
        | "discord_user_invalid";
      reply: string;
    };

export async function bindDiscordAccount(
  repository: Pick<
    PostgresDiscordAccountRepository,
    "redeemBindingCode"
  >,
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
    const binding = await repository.redeemBindingCode({
      codeHash: hashDiscordBindingCode(normalizedCode),
      discordUserId: input.discordUserId,
      discordUsername: input.discordUsername,
      dmChannelId: input.dmChannelId,
      occurredAt: input.occurredAt,
    });

    if (!binding) {
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

    console.error("[discord-web]", "discord_binding_failed", {
      discordUserId: input.discordUserId,
      errorCode: readErrorCode(error),
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

function readErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "unknown";
}
