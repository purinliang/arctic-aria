import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
} from "discord-interactions";
import { ideaCommandName } from "./discord-commands.ts";
import { captureDiscordIdea } from "./idea-capture.ts";
import type { QueryExecutor } from "./query-executor.ts";

export type DiscordInteractionResult = {
  status: number;
  body: Record<string, unknown>;
};

type DiscordInteraction = {
  type?: number;
  context?: number;
  data?: {
    name?: string;
    options?: Array<{
      name?: string;
      value?: unknown;
    }>;
  };
  user?: DiscordInteractionUser;
  member?: {
    user?: DiscordInteractionUser;
  };
  channel_id?: string;
};

type DiscordInteractionUser = {
  id?: string;
  username?: string;
};

export async function handleDiscordInteraction(
  sql: QueryExecutor,
  interaction: unknown,
): Promise<DiscordInteractionResult> {
  if (!isRecord(interaction)) {
    return errorResponse(400, "Invalid Discord interaction payload.");
  }

  const body = interaction as DiscordInteraction;

  if (body.type === InteractionType.PING) {
    return {
      status: 200,
      body: {
        type: InteractionResponseType.PONG,
      },
    };
  }

  if (body.type !== InteractionType.APPLICATION_COMMAND) {
    return messageResponse(body, "Unsupported Discord interaction.");
  }

  if (body.data?.name !== ideaCommandName) {
    return messageResponse(body, "Unknown Arctic Aria command.");
  }

  const user = readInteractionUser(body);
  const rawText = readOptionString(body, "text");

  if (!user?.id) {
    return messageResponse(body, "This Discord account id is invalid.");
  }

  const result = await captureDiscordIdea(sql, {
    discordUserId: user.id,
    discordUsername: user.username ?? null,
    dmChannelId: body.channel_id ?? null,
    rawText,
    occurredAt: new Date(),
  });

  return messageResponse(body, result.reply);
}

function readInteractionUser(interaction: DiscordInteraction) {
  return interaction.member?.user ?? interaction.user ?? null;
}

function readOptionString(interaction: DiscordInteraction, name: string) {
  const option = interaction.data?.options?.find((item) => item.name === name);

  return typeof option?.value === "string" ? option.value : "";
}

function messageResponse(
  interaction: DiscordInteraction,
  content: string,
): DiscordInteractionResult {
  const data: Record<string, unknown> = {
    content,
  };

  if (interaction.context === 0) {
    data.flags = InteractionResponseFlags.EPHEMERAL;
  }

  return {
    status: 200,
    body: {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data,
    },
  };
}

function errorResponse(
  status: number,
  message: string,
): DiscordInteractionResult {
  return {
    status,
    body: {
      error: message,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}
