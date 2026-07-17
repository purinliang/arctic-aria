import { PostgresDiscordAccountRepository } from "../../../server/discord/discord-account-repository.ts";
import { PostgresIdeaRepository } from "../../ideas/server/postgres-idea-repository.ts";
import { bindDiscordAccount } from "./account-binding.ts";
import { bindCommandName, ideaCommandName } from "./commands.ts";
import { captureDiscordIdea } from "./idea-capturing.ts";

const interactionTypePing = 1;
const interactionTypeApplicationCommand = 2;
const interactionResponseTypePong = 1;
const interactionResponseTypeMessage = 4;
const interactionResponseFlagEphemeral = 1 << 6;

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
  interaction: unknown,
  repositories = {
    discordAccounts: new PostgresDiscordAccountRepository(),
    ideas: new PostgresIdeaRepository(),
  },
): Promise<InboundDiscordInteractionResult> {
  if (!isRecord(interaction)) {
    return errorResponse(400, "Invalid Discord interaction payload.");
  }

  const body = interaction as DiscordInteraction;

  if (body.type === interactionTypePing) {
    return {
      status: 200,
      body: {
        type: interactionResponseTypePong,
      },
    };
  }

  if (body.type !== interactionTypeApplicationCommand) {
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
    const result = await bindDiscordAccount(repositories.discordAccounts, {
      discordUserId: user.id,
      discordUsername: user.username ?? null,
      dmChannelId: body.channel_id ?? null,
      rawCode: readOptionString(body, "code"),
      occurredAt: new Date(),
    });

    return messageResponse(body, result.reply);
  }

  const result = await captureDiscordIdea(repositories, {
    discordUserId: user.id,
    discordUsername: user.username ?? null,
    dmChannelId: body.channel_id ?? null,
    rawText: readOptionString(body, "text"),
    occurredAt: new Date(),
  });

  return messageResponse(body, result.reply);
}

export function inboundInteractionLogLabel(payload: unknown) {
  const commandName = readInboundCommandName(payload);

  if (typeof commandName === "string") {
    return `/${commandName}`;
  }

  const interactionType = readInteractionType(payload);

  if (interactionType === interactionTypePing) {
    return "ping";
  }

  return typeof interactionType === "number"
    ? `interaction_type_${interactionType}`
    : "unknown";
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
    data.flags = interactionResponseFlagEphemeral;
  }

  return {
    status: 200,
    body: {
      type: interactionResponseTypeMessage,
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

function readInteractionType(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const interaction = payload as {
    type?: unknown;
  };

  return typeof interaction.type === "number" ? interaction.type : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}
