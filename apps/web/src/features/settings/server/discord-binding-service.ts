import { PostgresDiscordAccountRepository } from "../../../server/discord/discord-account-repository.ts";
import {
  createDiscordBindingCodeValue,
  hashDiscordBindingCode,
} from "./discord-binding-code.ts";

const codeExpiryMinutes = 15;

export type DiscordBindingView = {
  discordUserId: string;
  discordUsername: string | null;
  lastInteractionAt: string | null;
  updatedAt: string;
};

export type DiscordBindingActionResult =
  | {
      ok: true;
      code:
        | "settings_discord_binding_loaded"
        | "settings_discord_code_canceled"
        | "settings_discord_code_created"
        | "settings_discord_unbound";
      binding: DiscordBindingView | null;
      bindingCode?: {
        value: string;
        expiresAt: string;
      };
    }
  | {
      ok: false;
      code:
        | "settings_unauthorized"
        | "settings_discord_binding_unavailable"
        | "settings_discord_code_cancel_failed"
        | "settings_discord_code_create_failed"
        | "settings_discord_unbind_failed";
      message: string;
    };

type DiscordBindingRepository = Pick<
  PostgresDiscordAccountRepository,
  | "cancelBindingCodesByUserId"
  | "createBindingCode"
  | "findActiveByUserId"
  | "revokeActiveByUserId"
>;

export function createDiscordBindingService(
  repository: DiscordBindingRepository = new PostgresDiscordAccountRepository(),
) {
  return {
    async getBinding(userId: string): Promise<DiscordBindingActionResult> {
      try {
        const binding = await repository.findActiveByUserId(userId);

        return {
          ok: true,
          code: "settings_discord_binding_loaded",
          binding: binding ? toBindingView(binding) : null,
        };
      } catch {
        return {
          ok: false,
          code: "settings_discord_binding_unavailable",
          message: "Discord binding is unavailable.",
        };
      }
    },

    async createBindingCode(
      userId: string,
    ): Promise<DiscordBindingActionResult> {
      const codeValue = createDiscordBindingCodeValue();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + codeExpiryMinutes * 60 * 1000);

      try {
        await repository.createBindingCode({
          userId,
          codeHash: hashDiscordBindingCode(codeValue),
          expiresAt,
          createdAt: now,
        });

        const binding = await repository.findActiveByUserId(userId);

        return {
          ok: true,
          code: "settings_discord_code_created",
          binding: binding ? toBindingView(binding) : null,
          bindingCode: {
            value: codeValue,
            expiresAt: expiresAt.toISOString(),
          },
        };
      } catch {
        return {
          ok: false,
          code: "settings_discord_code_create_failed",
          message: "Discord connection code could not be created.",
        };
      }
    },

    async unbind(userId: string): Promise<DiscordBindingActionResult> {
      try {
        await repository.revokeActiveByUserId(userId, new Date());

        return {
          ok: true,
          code: "settings_discord_unbound",
          binding: null,
        };
      } catch {
        return {
          ok: false,
          code: "settings_discord_unbind_failed",
          message: "Discord account could not be disconnected.",
        };
      }
    },

    async cancelBindingCode(
      userId: string,
    ): Promise<DiscordBindingActionResult> {
      try {
        await repository.cancelBindingCodesByUserId(userId, new Date());
        const binding = await repository.findActiveByUserId(userId);

        return {
          ok: true,
          code: "settings_discord_code_canceled",
          binding: binding ? toBindingView(binding) : null,
        };
      } catch {
        return {
          ok: false,
          code: "settings_discord_code_cancel_failed",
          message: "Discord connection code could not be canceled.",
        };
      }
    },
  };
}

function toBindingView(binding: {
  discordUserId: string;
  discordUsername: string | null;
  lastInteractionAt: Date | null;
  updatedAt: Date;
}): DiscordBindingView {
  return {
    discordUserId: binding.discordUserId,
    discordUsername: binding.discordUsername,
    lastInteractionAt: binding.lastInteractionAt?.toISOString() ?? null,
    updatedAt: binding.updatedAt.toISOString(),
  };
}

export const discordBindingService = createDiscordBindingService();
