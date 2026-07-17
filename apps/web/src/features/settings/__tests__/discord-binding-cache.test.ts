import assert from "node:assert/strict";
import test from "node:test";
import {
  clearDiscordBindingCache,
  readDiscordBindingCache,
  writeDiscordBindingCache,
} from "../discord-binding-cache.ts";

test("discord binding cache is keyed by Arctic Aria user id", () => {
  clearDiscordBindingCache("user-one");
  clearDiscordBindingCache("user-two");

  writeDiscordBindingCache("user-one", {
    binding: {
      discordUserId: "discord-one",
      discordUsername: "testdisplayname",
    },
    pendingBindingCode: null,
  });

  assert.deepEqual(readDiscordBindingCache("user-one"), {
    binding: {
      discordUserId: "discord-one",
      discordUsername: "testdisplayname",
    },
    pendingBindingCode: null,
  });
  assert.equal(readDiscordBindingCache("user-two"), null);
});

test("discord binding cache does not expose mutable snapshots", () => {
  clearDiscordBindingCache("user-one");

  writeDiscordBindingCache("user-one", {
    binding: null,
    pendingBindingCode: {
      value: "ABCD-EFGH-IJKL",
      expiresAt: "2026-07-18T00:00:00.000Z",
    },
  });

  const snapshot = readDiscordBindingCache("user-one");

  assert.ok(snapshot?.pendingBindingCode);

  snapshot.pendingBindingCode.value = "changed";

  assert.equal(
    readDiscordBindingCache("user-one")?.pendingBindingCode?.value,
    "ABCD-EFGH-IJKL",
  );
});
