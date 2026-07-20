import { discordCommandData } from "./commands.ts";

async function main() {
  const discordAppId = readRequiredEnv("DISCORD_APP_ID");
  const discordBotToken = readRequiredEnv("DISCORD_BOT_TOKEN");

  const response = await fetch(
    `https://discord.com/api/v10/applications/${encodeURIComponent(
      discordAppId,
    )}/commands`,
    {
      method: "PUT",
      headers: {
        authorization: `Bot ${discordBotToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(discordCommandData),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Discord command sync failed with status ${response.status}.`,
    );
  }

  console.log("[discord-web]", "commands_synced", {
    count: discordCommandData.length,
  });
}

function readRequiredEnv(key: string) {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}.`);
  }

  return value;
}

main().catch((error) => {
  console.error("[discord-web]", "command_sync_failed", {
    message: error instanceof Error ? error.message : "unknown",
  });
  process.exitCode = 1;
});
