import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hashDiscordBindingCode,
  normalizeDiscordBindingCode,
} from "../features/account-binding/binding-code.ts";

describe("Discord binding codes", () => {
  it("normalizes spaces, hyphens, and case before hashing", () => {
    assert.equal(normalizeDiscordBindingCode(" abcd-efgh jklm "), "ABCDEFGHJKLM");
    assert.equal(
      hashDiscordBindingCode("abcd-efgh jklm"),
      hashDiscordBindingCode("ABCDEFGHJKLM"),
    );
  });
});
