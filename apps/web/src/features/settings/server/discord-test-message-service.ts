import { randomUUID } from "node:crypto";
import {
  createDiscordNotificationService,
  discordNotificationService,
} from "../../discord/server/notification-service.ts";
import type { OutboundMessageResult } from "../../discord/server/message-push.ts";
import type { ActionFailureResult } from "../../../messages/action-result.ts";

const testMessageText =
  "Hello from Arctic Aria. Discord message push is working.";

export type DiscordTestMessageActionResult =
  | {
      ok: true;
      code: "settings_discord_test_sent";
    }
  | (ActionFailureResult & {
      code:
        | "settings_unauthorized"
        | "settings_discord_test_bot_unavailable"
        | "settings_discord_test_config_missing"
        | "settings_discord_test_delivery_failed"
        | "settings_discord_test_no_binding";
    });

type DiscordTestMessageConfig = {
  discordBotToken: string | null;
  missingEnvVars?: readonly string[];
};

type DiscordTestMessageSender = (
  input: unknown,
) => Promise<OutboundMessageResult>;

export function createDiscordTestMessageService({
  config,
  sender,
  notificationService = discordNotificationService,
}: {
  config?: DiscordTestMessageConfig;
  sender?: DiscordTestMessageSender;
  notificationService?: ReturnType<typeof createDiscordNotificationService>;
} = {}) {
  if (config || sender) {
    notificationService = createDiscordNotificationService({
      config: config ?? readDiscordTestMessageConfig(),
      sender,
    });
  }

  return {
    async sendTestMessage(
      userId: string,
    ): Promise<DiscordTestMessageActionResult> {
      const result = await notificationService.sendUserNotification({
        userId,
        idempotencyKey: `settings-discord-test-${randomUUID()}`,
        text: testMessageText,
        source: "manual",
        metadata: {
          feature: "settings",
          action: "discord-test-message",
        },
        logEventName: "settings_test_message_handled",
      });

      if (result.ok) {
        return {
          ok: true,
          code: "settings_discord_test_sent",
        };
      }

      if (result.code === "discord_notification_config_missing") {
        return configMissingResult();
      }

      if (result.code === "discord_notification_bot_unavailable") {
        return {
          ok: false,
          code: "settings_discord_test_bot_unavailable",
          message: configMissingMessage,
          category: "server",
          action: "update",
          subject: "discord",
        };
      }

      if (result.code === "discord_notification_delivery_failed") {
        return {
          ok: false,
          code: "settings_discord_test_delivery_failed",
          message: "Server internal error.",
          category: "server",
          action: "update",
          subject: "discord",
        };
      }

      if (result.code === "discord_notification_no_binding") {
        return {
          ok: false,
          code: "settings_discord_test_no_binding",
          message: result.message,
          category: "domain",
          action: "update",
          subject: "discord",
        };
      }

      return {
        ok: false,
        code: "settings_discord_test_bot_unavailable",
        message: configMissingMessage,
        category: "server",
        action: "update",
        subject: "discord",
      };
    },
  };
}

function readDiscordTestMessageConfig(
  env: NodeJS.ProcessEnv = process.env,
): DiscordTestMessageConfig {
  return {
    discordBotToken: env.DISCORD_BOT_TOKEN?.trim() || null,
    missingEnvVars: env.DISCORD_BOT_TOKEN?.trim() ? [] : ["DISCORD_BOT_TOKEN"],
  };
}

const configMissingMessage =
  "Server internal error.";

function configMissingResult(): DiscordTestMessageActionResult {
  return {
    ok: false,
    code: "settings_discord_test_config_missing",
    message: configMissingMessage,
    category: "server",
    action: "update",
    subject: "discord",
  };
}

export const discordTestMessageService = createDiscordTestMessageService();
