export type DiscordDirectMessageInput = {
  discordUserId: string;
  dmChannelId: string | null;
  text: string;
};

export type DiscordDirectMessageResult = {
  discordMessageId: string | null;
  dmChannelId: string | null;
};

export type DiscordMessageSender = {
  sendDirectMessage(
    input: DiscordDirectMessageInput,
  ): Promise<DiscordDirectMessageResult>;
};

export class DiscordApiError extends Error {
  readonly code: string;
  readonly status: number | null;

  constructor(
    code: string,
    message = "Discord API request failed.",
    status: number | null = null,
  ) {
    super(message);
    this.name = "DiscordApiError";
    this.code = code;
    this.status = status;
  }
}

export function createDiscordMessageSender(
  botToken: string,
): DiscordMessageSender {
  return {
    async sendDirectMessage(input) {
      if (input.dmChannelId) {
        try {
          const message = await sendChannelMessage(
            botToken,
            input.dmChannelId,
            input.text,
          );

          return {
            discordMessageId: readStringProperty(message, "id"),
            dmChannelId: input.dmChannelId,
          };
        } catch (error) {
          if (!shouldRetryStoredDmChannel(error)) {
            throw error;
          }
        }
      }

      const dmChannelId = await createDirectMessageChannel(
        botToken,
        input.discordUserId,
      );
      const message = await sendChannelMessage(botToken, dmChannelId, input.text);

      return {
        discordMessageId: readStringProperty(message, "id"),
        dmChannelId,
      };
    },
  };
}

async function createDirectMessageChannel(
  botToken: string,
  discordUserId: string,
) {
  const body = await discordRequest(botToken, "/users/@me/channels", {
    recipient_id: discordUserId,
  });
  const channelId = readStringProperty(body, "id");

  if (!channelId) {
    throw new DiscordApiError("discord_dm_channel_missing");
  }

  return channelId;
}

async function sendChannelMessage(
  botToken: string,
  channelId: string,
  content: string,
) {
  return discordRequest(botToken, `/channels/${channelId}/messages`, {
    content,
  });
}

async function discordRequest(
  botToken: string,
  path: string,
  body: Record<string, unknown>,
) {
  const response = await fetch(`https://discord.com/api/v10${path}`, {
    method: "POST",
    headers: {
      authorization: `Bot ${botToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new DiscordApiError(
      `discord_http_${response.status}`,
      "Discord API request failed.",
      response.status,
    );
  }

  return (await response.json()) as unknown;
}

function shouldRetryStoredDmChannel(error: unknown) {
  if (!(error instanceof DiscordApiError)) {
    return false;
  }

  return error.status === 400 || error.status === 403 || error.status === 404;
}

function readStringProperty(value: unknown, key: string) {
  if (!value || typeof value !== "object" || !(key in value)) {
    return null;
  }

  const property = (value as Record<string, unknown>)[key];

  return typeof property === "string" && property.length > 0 ? property : null;
}
