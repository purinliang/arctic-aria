import { randomUUID } from "node:crypto";

const localMessagePushUrl = "http://localhost:3000/api/internal/discord/messages";
const webMessagePushPath = "/api/internal/discord/messages";
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
          "Set DISCORD_MESSAGE_PUSH_URL or deploy with VERCEL_URL so the web app can call its Discord message endpoint.",
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
              "Discord message-push secret was rejected. Check DISCORD_MESSAGE_PUSH_SECRET in the web environment.",
          };
        }

        if (response.status === 503) {
          return {
            ok: false,
            code: "settings_discord_test_bot_unavailable",
            message:
              "Discord message push is not configured. Set DISCORD_BOT_TOKEN and DISCORD_MESSAGE_PUSH_SECRET in the web environment.",
          };
        }

        return {
            ok: false,
            code: "settings_discord_test_delivery_failed",
            message:
              "Discord test message could not be delivered. Check the web server log for the outbound_message_handled status.",
        };
      } catch {
        return {
          ok: false,
          code: "settings_discord_test_unreachable",
          message:
            "Discord message endpoint is unreachable. Check DISCORD_MESSAGE_PUSH_URL or the web app deployment.",
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
      readDefaultMessagePushUrl(env),
  };
}

function readDefaultMessagePushUrl(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV !== "production") {
    return localMessagePushUrl;
  }

  const vercelUrl = readOptionalEnv(env, "VERCEL_URL");

  return vercelUrl ? `https://${vercelUrl}${webMessagePushPath}` : null;
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
