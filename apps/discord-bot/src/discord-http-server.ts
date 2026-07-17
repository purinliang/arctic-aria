import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { verifyKey } from "discord-interactions";
import { handleInboundDiscordInteraction } from "./inbound-interaction-handler.ts";
import type { QueryExecutor } from "./query-executor.ts";

const maxBodyBytes = 64 * 1024;

export function createDiscordHttpServer(
  options: { discordPublicKey: string },
  sql: QueryExecutor,
) {
  return createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/health") {
        sendJson(response, 200, { ok: true });
        return;
      }

      if (request.method === "GET" && request.url === "/interactions") {
        sendJson(response, 405, browserInteractionHelpResponse());
        return;
      }

      if (request.method !== "POST" || request.url !== "/interactions") {
        sendJson(response, 404, { error: "Not found." });
        return;
      }

      const rawBody = await readRequestBody(request);
      const signature = readHeader(request, "x-signature-ed25519");
      const timestamp = readHeader(request, "x-signature-timestamp");

      if (!signature || !timestamp) {
        sendJson(response, 401, { error: "Missing Discord signature." });
        return;
      }

      const verified = await verifyKey(
        rawBody,
        signature,
        timestamp,
        options.discordPublicKey,
      );

      if (!verified) {
        sendJson(response, 401, { error: "Bad Discord signature." });
        return;
      }

      const payload = JSON.parse(rawBody.toString("utf8")) as unknown;
      const result = await handleInboundDiscordInteraction(sql, payload);
      console.log("[discord-bot]", "inbound_interaction_handled", {
        command: inboundInteractionLogLabel(payload),
        status: result.status,
      });
      sendJson(response, result.status, result.body);
    } catch (error) {
      console.error("[discord-bot]", "inbound_interaction_request_failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
      sendJson(response, 500, { error: "Inbound interaction failed." });
    }
  });
}

export function browserInteractionHelpResponse() {
  return {
    error:
      "Discord interactions use POST requests. Set the public Discord endpoint URL to this path, but do not open it directly in a browser.",
    expectedMethod: "POST",
  };
}

function readHeader(request: IncomingMessage, name: string) {
  const value = request.headers[name];

  return Array.isArray(value) ? value[0] : value;
}

function readRequestBody(request: IncomingMessage) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    request.on("data", (chunk: Buffer) => {
      size += chunk.length;

      if (size > maxBodyBytes) {
        reject(new Error("Discord interaction request body is too large."));
        request.destroy();
        return;
      }

      chunks.push(chunk);
    });

    request.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    request.on("error", reject);
  });
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: Record<string, unknown>,
) {
  const payload = JSON.stringify(body);

  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
  });
  response.end(payload);
}

function inboundInteractionLogLabel(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "unknown";
  }

  const interaction = payload as {
    type?: unknown;
    context?: unknown;
    data?: {
      name?: unknown;
    };
    user?: unknown;
    member?: {
      user?: unknown;
    };
  };
  const commandName = interaction.data?.name;

  if (typeof commandName === "string") {
    return `/${commandName}`;
  }

  if (interaction.type === 1) {
    return "ping";
  }

  return typeof interaction.type === "number"
    ? `interaction_type_${interaction.type}`
    : "unknown";
}
