import { randomUUID } from "node:crypto";

const localMessagePushUrl = "http://localhost:3001/internal/discord/messages";
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
        | "settings_discord_test_no_binding"
        | "settings_discord_test_secret_rejected"
        | "settings_discord_test_unreachable";
      message: string;
    };

type Fetcher = (
  input: string | URL,
  init: {
    body: string;
    headers: Record<string, string>;
    method: "POST";
  },
) => Promise<{
  ok: boolean;
  status: number;
}>;

type DiscordTestMessageConfig = {
  messagePushSecret: string | null;
  messagePushUrl: string | null;
};

export function createDiscordTestMessageService({
  config = readDiscordTestMessageConfig(),
  fetcher = globalThis.fetch as Fetcher,
}: {
  config?: DiscordTestMessageConfig;
  fetcher?: Fetcher;
} = {}) {
  return {
    async sendTestMessage(
      userId: string,
    ): Promise<DiscordTestMessageActionResult> {
      const targetUrl = parseMessagePushUrl(config.messagePushUrl);

      if (!config.messagePushSecret) {
        return configMissingResult(
          "Set DISCORD_MESSAGE_PUSH_SECRET in apps/web/.env.local and restart the web server.",
        );
      }

      if (!targetUrl) {
        return configMissingResult(
          "Set DISCORD_MESSAGE_PUSH_URL to the Discord bot message endpoint and restart the web server.",
        );
      }

      try {
        const response = await fetcher(targetUrl, {
          method: "POST",
          headers: {
            authorization: `Bearer ${config.messagePushSecret}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            userId,
            idempotencyKey: `settings-discord-test-${randomUUID()}`,
            text: testMessageText,
            source: "manual",
            metadata: {
              feature: "settings",
              action: "discord-test-message",
            },
          }),
        });

        if (response.ok) {
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

        if (response.status === 401) {
          return {
            ok: false,
            code: "settings_discord_test_secret_rejected",
            message:
              "Discord message-push secret was rejected. Use the same DISCORD_MESSAGE_PUSH_SECRET in web and bot env files, then restart both servers.",
          };
        }

        if (response.status === 503) {
          return {
            ok: false,
            code: "settings_discord_test_bot_unavailable",
            message:
              "Discord bot message push is not configured. Set DISCORD_BOT_TOKEN and DISCORD_MESSAGE_PUSH_SECRET in apps/discord-bot/.env.local, then restart the bot server.",
          };
        }

        return {
          ok: false,
          code: "settings_discord_test_delivery_failed",
          message:
            "Discord test message could not be delivered. Check the bot log for the outbound_message_handled status.",
        };
      } catch {
        return {
          ok: false,
          code: "settings_discord_test_unreachable",
          message:
            "Discord bot message endpoint is unreachable. Start apps/discord-bot or check DISCORD_MESSAGE_PUSH_URL.",
        };
      }
    },
  };
}

function readDiscordTestMessageConfig(
  env: NodeJS.ProcessEnv = process.env,
): DiscordTestMessageConfig {
  return {
    messagePushSecret: readOptionalEnv(env, "DISCORD_MESSAGE_PUSH_SECRET"),
    messagePushUrl:
      readOptionalEnv(env, "DISCORD_MESSAGE_PUSH_URL") ??
      (env.NODE_ENV === "production" ? null : localMessagePushUrl),
  };
}

function parseMessagePushUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function readOptionalEnv(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key]?.trim();

  return value && value.length > 0 ? value : null;
}

function configMissingResult(message: string): DiscordTestMessageActionResult {
  return {
    ok: false,
    code: "settings_discord_test_config_missing",
    message,
  };
}

export const discordTestMessageService = createDiscordTestMessageService();
