import assert from "node:assert/strict";
import test from "node:test";
import {
  createDiscordBindingCodeValue,
  hashDiscordBindingCode,
  normalizeDiscordBindingCode,
} from "../server/discord-binding-code.ts";

test("discord binding codes are readable and hash normalized input", () => {
  const code = createDiscordBindingCodeValue();

  assert.match(
    code,
    /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/,
  );
  assert.equal(normalizeDiscordBindingCode(" abcd-efgh jklm "), "ABCDEFGHJKLM");
  assert.equal(
    hashDiscordBindingCode("abcd-efgh jklm"),
    hashDiscordBindingCode("ABCDEFGHJKLM"),
  );
});
