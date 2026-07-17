import type { IncomingMessage, ServerResponse } from "node:http";
import { createDiscordMessageSender } from "./api.ts";
import type { QueryExecutor } from "./database.ts";
import { readHeader, readRequestBody, sendJson } from "./http-helpers.ts";
import { handleOutboundDiscordMessage } from "../features/message-push.ts";

export const messagePushPath = "/internal/discord/messages";

export async function handleMessagePushRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: {
    discordBotToken: string | null;
    discordMessagePushSecret: string | null;
  },
  sql: QueryExecutor,
) {
  if (request.method === "GET") {
    sendJson(response, 405, browserMessagePushHelpResponse());
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  if (!options.discordBotToken || !options.discordMessagePushSecret) {
    sendJson(response, 503, { error: "Outbound Discord messages unavailable." });
    return;
  }

  const bearerToken = readBearerToken(readHeader(request, "authorization"));

  if (bearerToken !== options.discordMessagePushSecret) {
    sendJson(response, 401, { error: "Invalid message-push secret." });
    return;
  }

  const rawBody = await readRequestBody(request);
  const payload = JSON.parse(rawBody.toString("utf8")) as unknown;
  const result = await handleOutboundDiscordMessage(
    sql,
    payload,
    createDiscordMessageSender(options.discordBotToken),
  );

  console.log("[discord-bot]", "outbound_message_handled", result.log);
  sendJson(response, result.status, result.body);
}

export function browserMessagePushHelpResponse() {
  return {
    error:
      "Outbound Discord messages use POST requests with Authorization: Bearer <secret>.",
    expectedMethod: "POST",
  };
}

export function readBearerToken(value: string | undefined) {
  const match = /^Bearer\s+(.+)$/i.exec(value?.trim() ?? "");

  return match?.[1]?.trim() ?? null;
}
