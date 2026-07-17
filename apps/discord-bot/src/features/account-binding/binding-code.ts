import { createHash } from "node:crypto";

export function normalizeDiscordBindingCode(input: string) {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function hashDiscordBindingCode(input: string) {
  return createHash("sha256")
    .update(normalizeDiscordBindingCode(input), "utf8")
    .digest("hex");
}
