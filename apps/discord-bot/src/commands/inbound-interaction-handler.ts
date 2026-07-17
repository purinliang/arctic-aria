import {
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
} from "discord-interactions";
import { bindDiscordAccount } from "../features/discord-bindings/bind.ts";
import { captureDiscordIdea } from "../features/ideas/idea-capture.ts";
import type { QueryExecutor } from "../infrastructure/query-executor.ts";
import { bindCommandName, ideaCommandName } from "./discord-commands.ts";

export type InboundDiscordInteractionResult = {
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

export async function handleInboundDiscordInteraction(
  sql: QueryExecutor,
  interaction: unknown,
): Promise<InboundDiscordInteractionResult> {
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

  if (
    body.data?.name !== ideaCommandName &&
    body.data?.name !== bindCommandName
  ) {
    return messageResponse(body, "Unknown Arctic Aria command.");
  }

  const user = readInteractionUser(body);

  if (!user?.id) {
    return messageResponse(body, "This Discord account id is invalid.");
  }

  if (body.data?.name === bindCommandName) {
    const result = await bindDiscordAccount(sql, {
      discordUserId: user.id,
      discordUsername: user.username ?? null,
      dmChannelId: body.channel_id ?? null,
      rawCode: readOptionString(body, "code"),
      occurredAt: new Date(),
    });

    return messageResponse(body, result.reply);
  }

  const result = await captureDiscordIdea(sql, {
    discordUserId: user.id,
    discordUsername: user.username ?? null,
    dmChannelId: body.channel_id ?? null,
    rawText: readOptionString(body, "text"),
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
): InboundDiscordInteractionResult {
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
): InboundDiscordInteractionResult {
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
