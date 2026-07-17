import { readDiscordWebConfig, type DiscordWebConfig } from "./config.ts";
import {
  handleInboundDiscordInteraction,
  inboundInteractionLogLabel,
} from "./interactions.ts";
import { verifyDiscordRequestSignature } from "./signature.ts";

export function discordInteractionHelpResponse() {
  return jsonResponse(405, {
    error:
      "Discord interactions use POST requests. Set the public Discord endpoint URL to this path, but do not open it directly in a browser.",
    expectedMethod: "POST",
  });
}

export async function handleDiscordInteractionRequest({
  config = readDiscordWebConfig(),
  request,
}: {
  config?: DiscordWebConfig;
  request: Request;
}) {
  if (!config.discordPublicKey) {
    return jsonResponse(503, {
      error: "Discord interactions are not configured.",
    });
  }

  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");

  if (!signature || !timestamp) {
    return jsonResponse(401, { error: "Missing Discord signature." });
  }

  const rawBody = Buffer.from(await request.arrayBuffer());
  const verified = verifyDiscordRequestSignature({
    body: rawBody,
    publicKey: config.discordPublicKey,
    signature,
    timestamp,
  });

  if (!verified) {
    return jsonResponse(401, { error: "Bad Discord signature." });
  }

  const payload = parseJsonPayload(rawBody);

  if (!payload.ok) {
    return jsonResponse(400, { error: payload.message });
  }

  const result = await handleInboundDiscordInteraction(payload.value);

  console.log("[discord-web]", "inbound_interaction_handled", {
    command: inboundInteractionLogLabel(payload.value),
    status: result.status,
  });

  return jsonResponse(result.status, result.body);
}

function parseJsonPayload(body: Buffer):
  | { ok: true; value: unknown }
  | { ok: false; message: string } {
  try {
    return {
      ok: true,
      value: JSON.parse(body.toString("utf8")) as unknown,
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
