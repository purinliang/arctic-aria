#!/usr/bin/env node

import { spawn } from "node:child_process";

const defaultPort = "3000";
const endpointPath = "/api/discord/interactions";
const rawDomain = process.env.DISCORD_NGROK_DOMAIN?.trim() ?? "";
const localPort = process.env.DISCORD_NGROK_PORT?.trim() || defaultPort;
const domain = normalizeNgrokDomain(rawDomain);
const args = ["http"];

if (domain) {
  args.push(`--url=${domain}`);
}

args.push(localPort);

console.log("[discord-web] starting_ngrok", {
  localPort,
  endpointPath,
  ...(domain
    ? { discordEndpointUrl: `https://${domain}${endpointPath}` }
    : { discordEndpointUrl: `https://<ngrok-domain>${endpointPath}` }),
});

const child = spawn("ngrok", args, {
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("[discord-web] ngrok_start_failed", {
    message: error.message,
  });
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 0;
});

function normalizeNgrokDomain(value) {
  if (!value) {
    return "";
  }

  return value
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .trim();
}
