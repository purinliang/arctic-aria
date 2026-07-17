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
        | "settings_discord_test_failed"
        | "settings_discord_test_no_binding"
        | "settings_discord_test_unavailable";
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

      if (!config.messagePushSecret || !targetUrl) {
        return unavailableResult();
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

        return {
          ok: false,
          code: "settings_discord_test_failed",
          message: "Discord test message could not be sent.",
        };
      } catch {
        return unavailableResult();
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

function unavailableResult(): DiscordTestMessageActionResult {
  return {
    ok: false,
    code: "settings_discord_test_unavailable",
    message: "Discord message push is unavailable.",
  };
}

export const discordTestMessageService = createDiscordTestMessageService();
