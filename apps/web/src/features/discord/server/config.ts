export type DiscordWebConfig = {
  discordAppId: string | null;
  discordBotToken: string | null;
  discordMessagePushSecret: string | null;
  discordPublicKey: string | null;
};

export function readDiscordWebConfig(
  env: NodeJS.ProcessEnv = process.env,
): DiscordWebConfig {
  return {
    discordAppId: readOptionalEnv(env, "DISCORD_APP_ID"),
    discordBotToken: readOptionalEnv(env, "DISCORD_BOT_TOKEN"),
    discordMessagePushSecret: readOptionalEnv(
      env,
      "DISCORD_MESSAGE_PUSH_SECRET",
    ),
    discordPublicKey: readOptionalEnv(env, "DISCORD_PUBLIC_KEY"),
  };
}

function readOptionalEnv(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key]?.trim();

  return value && value.length > 0 ? value : null;
}
