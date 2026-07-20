import { createDiscordMessageSender } from "./discord-api.ts";
import { handleOutboundDiscordMessage } from "./message-push.ts";
import type { OutboundMessageResult } from "./message-push.ts";
import { getSql } from "../../../server/database/neon.ts";

export type DiscordNotificationResult =
  | {
      ok: true;
      code: "discord_notification_sent";
    }
  | {
      ok: false;
      code:
        | "discord_notification_bot_unavailable"
        | "discord_notification_config_missing"
        | "discord_notification_delivery_failed"
        | "discord_notification_no_binding";
      message: string;
    };

export type DiscordNotificationInput = {
  userId: string;
  idempotencyKey: string;
  text: string;
  source: "web" | "scheduler" | "manual" | "agent";
  metadata: Record<string, unknown>;
  logEventName: string;
};

type DiscordNotificationConfig = {
  discordBotToken: string | null;
  missingEnvVars?: readonly string[];
};

type DiscordNotificationSender = (
  input: unknown,
) => Promise<OutboundMessageResult>;

export function createDiscordNotificationService({
  config = readDiscordNotificationConfig(),
  sender = createDefaultNotificationSender(config),
}: {
  config?: DiscordNotificationConfig;
  sender?: DiscordNotificationSender;
} = {}) {
  return {
    async sendUserNotification(
      input: DiscordNotificationInput,
    ): Promise<DiscordNotificationResult> {
      const missingEnvVars = readMissingEnvVars(config);

      if (missingEnvVars.length > 0) {
        console.warn("[discord-web]", "notification_config_missing", {
          missingEnvVars,
          feature: input.metadata.feature,
          action: input.metadata.action,
        });

        return configMissingResult();
      }

      try {
        const response = await sender({
          userId: input.userId,
          idempotencyKey: input.idempotencyKey,
          text: input.text,
          source: input.source,
          metadata: input.metadata,
        });

        console.log("[discord-web]", input.logEventName, response.log);

        if (response.status === 200) {
          return {
            ok: true,
            code: "discord_notification_sent",
          };
        }

        if (response.status === 404) {
          return {
            ok: false,
            code: "discord_notification_no_binding",
            message: "No active Discord binding.",
          };
        }

        if (response.status === 503) {
          return {
            ok: false,
            code: "discord_notification_bot_unavailable",
            message: configMissingMessage,
          };
        }

        return {
          ok: false,
          code: "discord_notification_delivery_failed",
          message: "Discord message could not be delivered.",
        };
      } catch {
        return {
          ok: false,
          code: "discord_notification_delivery_failed",
          message: "Discord message could not be delivered.",
        };
      }
    },
  };
}

function readDiscordNotificationConfig(
  env: NodeJS.ProcessEnv = process.env,
): DiscordNotificationConfig {
  return {
    discordBotToken: readOptionalEnv(env, "DISCORD_BOT_TOKEN"),
    missingEnvVars: readMissingRequiredEnvVars(env, ["DISCORD_BOT_TOKEN"]),
  };
}

function readOptionalEnv(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key]?.trim();

  return value && value.length > 0 ? value : null;
}

const configMissingMessage =
  "Discord configuration is missing. Check the web server log.";

function configMissingResult(): DiscordNotificationResult {
  return {
    ok: false,
    code: "discord_notification_config_missing",
    message: configMissingMessage,
  };
}

function readMissingRequiredEnvVars(env: NodeJS.ProcessEnv, keys: string[]) {
  return keys.filter((key) => !readOptionalEnv(env, key));
}

function readMissingEnvVars(config: DiscordNotificationConfig) {
  return (
    config.missingEnvVars ??
    (config.discordBotToken ? [] : ["DISCORD_BOT_TOKEN"])
  );
}

function createDefaultNotificationSender(
  config: DiscordNotificationConfig,
): DiscordNotificationSender {
  return (input) => {
    if (!config.discordBotToken) {
      throw new Error("Missing Discord bot token.");
    }

    return handleOutboundDiscordMessage(
      getSql(),
      input,
      createDiscordMessageSender(config.discordBotToken),
    );
  };
}

export const discordNotificationService = createDiscordNotificationService();
