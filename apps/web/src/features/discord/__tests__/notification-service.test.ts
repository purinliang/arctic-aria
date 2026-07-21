import assert from "node:assert/strict";
import test from "node:test";
import { createDiscordNotificationService } from "../server/notification-service.ts";

const userId = "123e4567-e89b-12d3-a456-426614174000";

test("discord notification service sends a user notification", async () => {
  const sender = createSenderStub({ status: 200 });
  const service = createDiscordNotificationService({
    config: {
      discordBotToken: "test-bot-token",
      missingEnvVars: [],
    },
    sender,
  });

  const result = await service.sendUserNotification({
    userId,
    idempotencyKey: "test-notification-key",
    text: "Routine reminder.",
    source: "scheduler",
    metadata: {
      feature: "routines",
      action: "routine-reminder",
    },
    logEventName: "test_notification_handled",
  });

  assert.deepEqual(result, {
    ok: true,
    code: "discord_notification_sent",
  });
  assert.deepEqual(sender.calls[0], {
    userId,
    idempotencyKey: "test-notification-key",
    text: "Routine reminder.",
    source: "scheduler",
    metadata: {
      feature: "routines",
      action: "routine-reminder",
    },
  });
});

test("discord notification service reports missing configuration", async () => {
  const sender = createSenderStub({ status: 200 });
  const service = createDiscordNotificationService({
    config: {
      discordBotToken: null,
      missingEnvVars: ["DISCORD_BOT_TOKEN"],
    },
    sender,
  });

  const result = await service.sendUserNotification({
    userId,
    idempotencyKey: "test-notification-key",
    text: "Routine reminder.",
    source: "scheduler",
    metadata: {
      feature: "routines",
      action: "routine-reminder",
    },
    logEventName: "test_notification_handled",
  });

  assert.deepEqual(result, {
    ok: false,
    code: "discord_notification_config_missing",
    message: "Server internal error.",
  });
  assert.equal(sender.calls.length, 0);
});

test("discord notification service reports missing binding", async () => {
  const service = createDiscordNotificationService({
    config: {
      discordBotToken: "test-bot-token",
      missingEnvVars: [],
    },
    sender: createSenderStub({ status: 404 }),
  });

  const result = await service.sendUserNotification({
    userId,
    idempotencyKey: "test-notification-key",
    text: "Routine reminder.",
    source: "scheduler",
    metadata: {
      feature: "routines",
      action: "routine-reminder",
    },
    logEventName: "test_notification_handled",
  });

  assert.deepEqual(result, {
    ok: false,
    code: "discord_notification_no_binding",
    message: "No active Discord binding.",
  });
});

test("discord notification service reports sender failures", async () => {
  const service = createDiscordNotificationService({
    config: {
      discordBotToken: "test-bot-token",
      missingEnvVars: [],
    },
    sender: createSenderStub(new Error("send failed")),
  });

  const result = await service.sendUserNotification({
    userId,
    idempotencyKey: "test-notification-key",
    text: "Routine reminder.",
    source: "scheduler",
    metadata: {
      feature: "routines",
      action: "routine-reminder",
    },
    logEventName: "test_notification_handled",
  });

  assert.deepEqual(result, {
    ok: false,
    code: "discord_notification_delivery_failed",
    message: "Discord message could not be delivered.",
  });
});

function createSenderStub(response: { status: number } | Error) {
  const calls: Array<Record<string, unknown>> = [];
  const sender = async (input: unknown) => {
    calls.push(input as Record<string, unknown>);

    if (response instanceof Error) {
      throw response;
    }

    return {
      status: response.status,
      body: {},
      log: {
        deliveryId: "test-delivery",
        status: response.status,
      },
    };
  };

  return Object.assign(sender, { calls });
}
