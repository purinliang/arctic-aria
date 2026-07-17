import { randomUUID } from "node:crypto";
import { createDiscordMessageSender } from "../../discord/server/discord-api.ts";
import { handleOutboundDiscordMessage } from "../../discord/server/message-push.ts";
import type { OutboundMessageResult } from "../../discord/server/message-push.ts";
import { getSql } from "../../../server/database/neon.ts";

const testMessageText =
  "Hello from Arctic Aria. Discord message push is working.";

export type DiscordTestMessageActionResult =
  | {
      ok: true;
      code: "settings_discord_test_sent";
    }
  | {
      ok: false;
      code:
        | "settings_unauthorized"
        | "settings_discord_test_bot_unavailable"
        | "settings_discord_test_config_missing"
        | "settings_discord_test_delivery_failed"
        | "settings_discord_test_no_binding";
      message: string;
    };

type DiscordTestMessageConfig = {
  discordBotToken: string | null;
  missingEnvVars?: readonly string[];
};

type DiscordTestMessageSender = (
  input: unknown,
) => Promise<OutboundMessageResult>;

export function createDiscordTestMessageService({
  config = readDiscordTestMessageConfig(),
  sender = createDefaultTestMessageSender(config),
}: {
  config?: DiscordTestMessageConfig;
  sender?: DiscordTestMessageSender;
} = {}) {
  return {
    async sendTestMessage(
      userId: string,
    ): Promise<DiscordTestMessageActionResult> {
      const missingEnvVars = readMissingEnvVars(config);

      if (missingEnvVars.length > 0) {
        console.warn("[discord-web]", "settings_test_message_config_missing", {
          missingEnvVars,
        });

        return configMissingResult();
      }

      try {
        const response = await sender({
          userId,
          idempotencyKey: `settings-discord-test-${randomUUID()}`,
          text: testMessageText,
          source: "manual",
          metadata: {
            feature: "settings",
            action: "discord-test-message",
          },
        });

        console.log(
          "[discord-web]",
          "settings_test_message_handled",
          response.log,
        );

        if (response.status === 200) {
          return {
            ok: true,
            code: "settings_discord_test_sent",
          };
        }

        if (response.status === 404) {
          return {
            ok: false,
            code: "settings_discord_test_no_binding",
            message: "No active Discord binding.",
          };
        }

        if (response.status === 503) {
          console.warn(
            "[discord-web]",
            "settings_test_message_config_missing",
            response.log,
          );

          return {
            ok: false,
            code: "settings_discord_test_bot_unavailable",
            message: configMissingMessage,
          };
        }

        return {
          ok: false,
          code: "settings_discord_test_delivery_failed",
          message:
            "Discord test message could not be delivered. Check the web server log for the settings_test_message_handled status.",
        };
      } catch {
        return {
          ok: false,
          code: "settings_discord_test_delivery_failed",
          message:
            "Discord test message could not be delivered. Check the web server log for the settings_test_message_handled status.",
        };
      }
    },
  };
}

function readDiscordTestMessageConfig(
  env: NodeJS.ProcessEnv = process.env,
): DiscordTestMessageConfig {
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

function configMissingResult(): DiscordTestMessageActionResult {
  return {
    ok: false,
    code: "settings_discord_test_config_missing",
    message: configMissingMessage,
  };
}

function readMissingRequiredEnvVars(env: NodeJS.ProcessEnv, keys: string[]) {
  return keys.filter((key) => !readOptionalEnv(env, key));
}

function readMissingEnvVars(config: DiscordTestMessageConfig) {
  return (
    config.missingEnvVars ??
    (config.discordBotToken ? [] : ["DISCORD_BOT_TOKEN"])
  );
}

function createDefaultTestMessageSender(
  config: DiscordTestMessageConfig,
): DiscordTestMessageSender {
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

export const discordTestMessageService = createDiscordTestMessageService();
