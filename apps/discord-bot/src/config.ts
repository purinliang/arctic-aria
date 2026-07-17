export type DiscordBotConfig = {
  discordBotToken: string | null;
  discordAppId: string;
  discordPublicKey: string | null;
  developerDiscordUserId: string | null;
  developerUsername: string | null;
  port: number;
};

export function loadDiscordBotConfig(
  env: NodeJS.ProcessEnv = process.env,
): DiscordBotConfig {
  return {
    discordBotToken: readOptionalEnv(env, "DISCORD_BOT_TOKEN"),
    discordAppId: readRequiredEnv(env, "DISCORD_APP_ID"),
    discordPublicKey: readOptionalEnv(env, "DISCORD_PUBLIC_KEY"),
    developerDiscordUserId: readOptionalEnv(env, "DISCORD_DEVELOPER_USER_ID"),
    developerUsername: readOptionalEnv(env, "ARCTIC_ARIA_DEVELOPER_USERNAME"),
    port: readOptionalPort(env, "PORT") ?? 3001,
  };
}

export function requireDiscordBotToken(config: DiscordBotConfig) {
  if (!config.discordBotToken) {
    throw new Error("Missing required environment variable: DISCORD_BOT_TOKEN.");
  }

  return config.discordBotToken;
}

export function requireDiscordPublicKey(config: DiscordBotConfig) {
  if (!config.discordPublicKey) {
    throw new Error("Missing required environment variable: DISCORD_PUBLIC_KEY.");
  }

  return config.discordPublicKey;
}

function readRequiredEnv(env: NodeJS.ProcessEnv, key: string) {
  const value = readOptionalEnv(env, key);

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}.`);
  }

  return value;
}

function readOptionalEnv(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key]?.trim();

  return value && value.length > 0 ? value : null;
}

function readOptionalPort(env: NodeJS.ProcessEnv, key: string) {
  const value = readOptionalEnv(env, key);

  if (!value) {
    return null;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${key} must be an integer between 1 and 65535.`);
  }

  return port;
}
