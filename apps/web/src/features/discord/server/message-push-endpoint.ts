import { getSql } from "../../../server/database/neon.ts";
import { createDiscordMessageSender } from "./discord-api.ts";
import { readDiscordWebConfig, type DiscordWebConfig } from "./config.ts";
import { handleOutboundDiscordMessage } from "./message-push.ts";

export function discordMessagePushHelpResponse() {
  return jsonResponse(405, {
    error:
      "Outbound Discord messages use POST requests with Authorization: Bearer <secret>.",
    expectedMethod: "POST",
  });
}

export async function handleDiscordMessagePushRequest({
  config = readDiscordWebConfig(),
  request,
}: {
  config?: DiscordWebConfig;
  request: Request;
}) {
  if (!config.discordBotToken || !config.discordMessagePushSecret) {
    return jsonResponse(503, {
      error: "Outbound Discord messages unavailable.",
    });
  }

  const bearerToken = readBearerToken(request.headers.get("authorization"));

  if (bearerToken !== config.discordMessagePushSecret) {
    return jsonResponse(401, { error: "Invalid message-push secret." });
  }

  const payload = await parseJsonRequest(request);

  if (!payload.ok) {
    return jsonResponse(400, { error: payload.message });
  }

  const result = await handleOutboundDiscordMessage(
    getSql(),
    payload.value,
    createDiscordMessageSender(config.discordBotToken),
  );

  console.log("[discord-web]", "outbound_message_handled", result.log);

  return jsonResponse(result.status, result.body);
}

export function readBearerToken(value: string | null) {
  const match = /^Bearer\s+(.+)$/i.exec(value?.trim() ?? "");

  return match?.[1]?.trim() ?? null;
}

async function parseJsonRequest(
  request: Request,
): Promise<{ ok: true; value: unknown } | { ok: false; message: string }> {
  try {
    return {
      ok: true,
      value: (await request.json()) as unknown,
    };
  } catch {
    return {
      ok: false,
      message: "Invalid JSON request body.",
    };
  }
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return Response.json(body, { status });
}
