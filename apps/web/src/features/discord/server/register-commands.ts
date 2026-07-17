import { discordCommandData } from "./commands.ts";
import { readDiscordWebConfig } from "./config.ts";

async function main() {
  const config = readDiscordWebConfig();

  if (!config.discordAppId) {
    throw new Error("Missing required environment variable: DISCORD_APP_ID.");
  }

  if (!config.discordBotToken) {
    throw new Error("Missing required environment variable: DISCORD_BOT_TOKEN.");
  }

  const response = await fetch(
    `https://discord.com/api/v10/applications/${encodeURIComponent(
      config.discordAppId,
    )}/commands`,
    {
      method: "PUT",
      headers: {
        authorization: `Bot ${config.discordBotToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(discordCommandData),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Discord command registration failed with status ${response.status}.`,
    );
  }

  console.log("[discord-web]", "commands_registered", {
    count: discordCommandData.length,
  });
}

main().catch((error) => {
  console.error("[discord-web]", "command_registration_failed", {
    message: error instanceof Error ? error.message : "unknown",
  });
  process.exitCode = 1;
});
