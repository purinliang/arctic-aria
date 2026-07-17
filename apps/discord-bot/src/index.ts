import type { Server } from "node:http";
import { loadDiscordBotConfig, requireDiscordPublicKey } from "./config.ts";
import { getSql } from "./database.ts";
import { ensureDeveloperDiscordBinding } from "./developer-binding.ts";
import { createDiscordHttpServer } from "./discord-http-server.ts";
import {
  checkDatabaseConnection,
  formatStartupFailure,
} from "./startup-checks.ts";

async function main() {
  let startupStep = "config";

  try {
    const config = loadDiscordBotConfig();

    startupStep = "discord_public_key";
    const discordPublicKey = requireDiscordPublicKey(config);

    startupStep = "database";
    const sql = getSql();
    await checkDatabaseConnection(sql);

    startupStep = "developer_binding";
    const developerBinding = await ensureDeveloperDiscordBinding(sql, {
      discordUserId: config.developerDiscordUserId,
      developerUsername: config.developerUsername,
      occurredAt: new Date(),
    });

    if (!developerBinding.ok) {
      console.warn(
        "[discord-bot]",
        developerBinding.code,
        developerBinding.message,
      );
    }

    startupStep = "http_server";
    const server = createDiscordHttpServer({ discordPublicKey }, sql);
    await listenServer(server, config.port);

    const localBaseUrl = `http://localhost:${config.port}`;

    console.log("[discord-bot]", "ready", {
      port: config.port,
      localBaseUrl,
    });
  } catch (error) {
    console.error(
      "[discord-bot]",
      "startup_failed",
      formatStartupFailure(startupStep, error),
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(
    "[discord-bot]",
    "startup_failed",
    formatStartupFailure("unhandled", error),
  );
  process.exitCode = 1;
});

function listenServer(server: Server, port: number) {
  return new Promise<void>((resolve, reject) => {
    function cleanup() {
      server.off("error", onError);
      server.off("listening", onListening);
    }

    function onError(error: Error) {
      cleanup();
      reject(error);
    }

    function onListening() {
      cleanup();
      resolve();
    }

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port);
  });
}
