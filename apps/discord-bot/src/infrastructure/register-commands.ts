import { REST, Routes } from "discord.js";
import { discordCommandData } from "../commands/discord-commands.ts";
import { loadDiscordBotConfig, requireDiscordBotToken } from "./config.ts";

async function main() {
  const config = loadDiscordBotConfig();
  const rest = new REST({ version: "10" }).setToken(
    requireDiscordBotToken(config),
  );

  await rest.put(Routes.applicationCommands(config.discordAppId), {
    body: discordCommandData,
  });

  console.log("[discord-bot]", "commands_registered", {
    count: discordCommandData.length,
  });
}

main().catch((error) => {
  console.error("[discord-bot]", "command_registration_failed", {
    message: error instanceof Error ? error.message : "unknown",
  });
  process.exitCode = 1;
});
