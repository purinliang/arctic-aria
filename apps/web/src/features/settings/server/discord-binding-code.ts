import { createHash, randomBytes } from "node:crypto";

const bindingCodeAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const bindingCodeLength = 12;

export function createDiscordBindingCodeValue() {
  const bytes = randomBytes(bindingCodeLength);
  let value = "";

  for (const byte of bytes) {
    value += bindingCodeAlphabet[byte % bindingCodeAlphabet.length];
  }

  return formatDiscordBindingCode(value);
}

export function normalizeDiscordBindingCode(input: string) {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function hashDiscordBindingCode(input: string) {
  return createHash("sha256")
    .update(normalizeDiscordBindingCode(input), "utf8")
    .digest("hex");
}

function formatDiscordBindingCode(value: string) {
  return value.match(/.{1,4}/g)?.join("-") ?? value;
}
