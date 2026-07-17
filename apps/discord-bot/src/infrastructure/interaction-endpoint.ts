import type { IncomingMessage, ServerResponse } from "node:http";
import {
  InteractionResponseFlags,
  InteractionResponseType,
  verifyKey,
} from "discord-interactions";
import type { DiscordInteractionResponseEditor } from "./api.ts";
import type { QueryExecutor } from "./database.ts";
import { readHeader, readRequestBody, sendJson } from "./http-helpers.ts";
import { bindCommandName, ideaCommandName } from "../interactions/commands.ts";
import {
  handleInboundDiscordInteraction,
  type InboundDiscordInteractionResult,
} from "../interactions/interaction-handler.ts";

const directInteractionResponseMs = 2000;

export type InteractionEndpointOptions = {
  discordAppId: string;
  discordPublicKey: string;
  interactionResponseEditor: DiscordInteractionResponseEditor;
};

export const interactionPath = "/interactions";

export async function handleInteractionRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: InteractionEndpointOptions,
  sql: QueryExecutor,
) {
  if (request.method === "GET") {
    sendJson(response, 405, browserInteractionHelpResponse());
    return;
  }

  if (request.method !== "POST") {
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

  if (shouldRaceInboundInteraction(payload)) {
    const commandTask = handleInboundCommand(sql, payload);
    const fastResult = await resolveBeforeTimeout(
      commandTask,
      directInteractionResponseMs,
    );

    if (fastResult) {
      console.log("[discord-bot]", "inbound_interaction_handled", {
        command: inboundInteractionLogLabel(payload),
        status: fastResult.status,
      });
      sendJson(response, fastResult.status, fastResult.body);
      return;
    }

    sendJson(response, 200, createInProgressInteractionResponse(payload));
    console.log("[discord-bot]", "inbound_interaction_pending", {
      command: inboundInteractionLogLabel(payload),
      status: 200,
    });

    void handleInboundInteractionFollowup(commandTask, payload, options).catch((error) => {
      console.error("[discord-bot]", "inbound_interaction_followup_failed", {
        command: inboundInteractionLogLabel(payload),
        message: error instanceof Error ? error.message : "unknown",
      });
    });
    return;
  }

  const result = await handleInboundDiscordInteraction(sql, payload);
  console.log("[discord-bot]", "inbound_interaction_handled", {
    command: inboundInteractionLogLabel(payload),
    status: result.status,
  });
  sendJson(response, result.status, result.body);
}

export async function handleInboundInteractionFollowup(
  commandTask: Promise<InboundDiscordInteractionResult>,
  payload: unknown,
  options: {
    discordAppId: string;
    interactionResponseEditor: DiscordInteractionResponseEditor;
  },
) {
  const interactionToken = readInteractionToken(payload);

  if (!interactionToken) {
    throw new Error("Deferred Discord interaction is missing its token.");
  }

  const result = await commandTask;
  await options.interactionResponseEditor.editOriginalInteractionResponse({
    applicationId: options.discordAppId,
    interactionToken,
    content: readInteractionResultContent(result),
  });

  console.log("[discord-bot]", "inbound_interaction_followup", {
    command: inboundInteractionLogLabel(payload),
    status: result.status,
  });
}

export function shouldRaceInboundInteraction(payload: unknown) {
  const commandName = readInboundCommandName(payload);

  return (
    readInteractionToken(payload) !== null &&
    (commandName === ideaCommandName || commandName === bindCommandName)
  );
}

export function createInProgressInteractionResponse(payload: unknown) {
  const data: Record<string, unknown> = {
    content: "Arctic Aria received this command. Finishing database work...",
  };

  if (readInteractionContext(payload) === 0) {
    data.flags = InteractionResponseFlags.EPHEMERAL;
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data,
  };
}

export function browserInteractionHelpResponse() {
  return {
    error:
      "Discord interactions use POST requests. Set the public Discord endpoint URL to this path, but do not open it directly in a browser.",
    expectedMethod: "POST",
  };
}

function inboundInteractionLogLabel(payload: unknown) {
  const commandName = readInboundCommandName(payload);

  if (typeof commandName === "string") {
    return `/${commandName}`;
  }

  const interactionType = readInteractionType(payload);

  if (interactionType === 1) {
    return "ping";
  }

  return typeof interactionType === "number"
    ? `interaction_type_${interactionType}`
    : "unknown";
}

async function handleInboundCommand(
  sql: QueryExecutor,
  payload: unknown,
): Promise<InboundDiscordInteractionResult> {
  try {
    return await handleInboundDiscordInteraction(sql, payload);
  } catch (error) {
    console.error("[discord-bot]", "inbound_interaction_command_failed", {
      command: inboundInteractionLogLabel(payload),
      message: error instanceof Error ? error.message : "unknown",
    });

    return {
      status: 200,
      body: {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: "Discord command failed.",
        },
      },
    };
  }
}

function resolveBeforeTimeout<T>(task: Promise<T>, timeoutMs: number) {
  return new Promise<T | null>((resolve, reject) => {
    const timeout = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    task.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function readInteractionResultContent(result: {
  body: Record<string, unknown>;
}) {
  const body = result.body;
  const data =
    body.data && typeof body.data === "object"
      ? (body.data as Record<string, unknown>)
      : null;
  const content = data?.content;

  if (typeof content === "string" && content.length > 0) {
    return content;
  }

  const error = body.error;

  return typeof error === "string" && error.length > 0
    ? error
    : "Discord command finished.";
}

function readInboundCommandName(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const interaction = payload as {
    data?: {
      name?: unknown;
    };
  };
  const commandName = interaction.data?.name;

  return typeof commandName === "string" ? commandName : null;
}

function readInteractionContext(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const interaction = payload as {
    context?: unknown;
  };

  return typeof interaction.context === "number" ? interaction.context : null;
}

function readInteractionToken(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const interaction = payload as {
    token?: unknown;
  };

  return typeof interaction.token === "string" && interaction.token.length > 0
    ? interaction.token
    : null;
}

function readInteractionType(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const interaction = payload as {
    type?: unknown;
  };

  return typeof interaction.type === "number" ? interaction.type : null;
}
