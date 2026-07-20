export type DiscordWebConfig = {
  discordBotToken: string | null;
  discordPublicKey: string | null;
};

export function readDiscordWebConfig(
  env: NodeJS.ProcessEnv = process.env,
): DiscordWebConfig {
  return {
    discordBotToken: readOptionalEnv(env, "DISCORD_BOT_TOKEN"),
    discordPublicKey: readOptionalEnv(env, "DISCORD_PUBLIC_KEY"),
  };
}

function readOptionalEnv(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key]?.trim();

  return value && value.length > 0 ? value : null;
}
