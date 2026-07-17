import { createServer } from "node:http";
import {
  createDiscordInteractionResponseEditor,
  type DiscordInteractionResponseEditor,
} from "./api.ts";
import type { QueryExecutor } from "./database.ts";
import { sendJson } from "./http-helpers.ts";
import {
  handleInteractionRequest,
  interactionPath,
} from "./interaction-endpoint.ts";
import {
  handleMessagePushRequest,
  messagePushPath,
} from "./message-push-endpoint.ts";

export function createDiscordHttpServer(
  options: {
    discordAppId: string;
    discordBotToken: string | null;
    discordMessagePushSecret: string | null;
    discordPublicKey: string;
    interactionResponseEditor?: DiscordInteractionResponseEditor;
  },
  sql: QueryExecutor,
) {
  const interactionResponseEditor =
    options.interactionResponseEditor ?? createDiscordInteractionResponseEditor();

  return createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/health") {
        sendJson(response, 200, { ok: true });
        return;
      }

      if (request.url === messagePushPath) {
        await handleMessagePushRequest(request, response, options, sql);
        return;
      }

      if (request.url === interactionPath) {
        await handleInteractionRequest(
          request,
          response,
          {
            discordAppId: options.discordAppId,
            discordPublicKey: options.discordPublicKey,
            interactionResponseEditor,
          },
          sql,
        );
        return;
      }

      sendJson(response, 404, { error: "Not found." });
    } catch (error) {
      console.error("[discord-bot]", "discord_http_request_failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
      sendJson(response, 500, { error: "Discord bot request failed." });
    }
  });
}
