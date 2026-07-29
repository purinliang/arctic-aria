import assert from "node:assert/strict";
import test from "node:test";
import {
  clearDiscordBindingCache,
  discordBindingCacheKey,
  readDiscordBindingCache,
  writeDiscordBindingCache,
} from "../discord-binding-cache.ts";

class MemoryStorage {
  private readonly items = new Map<string, string>();

  getItem(key: string) {
    return this.items.get(key) ?? null;
  }

  removeItem(key: string) {
    this.items.delete(key);
  }

  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}

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

test("discord binding cache writes a browser storage snapshot", () => {
  const storage = new MemoryStorage();

  writeDiscordBindingCache(
    "user-one",
    {
      binding: {
        discordUserId: "discord-one",
        discordUsername: null,
      },
      pendingBindingCode: null,
    },
    storage,
  );

  assert.deepEqual(
    JSON.parse(storage.getItem(discordBindingCacheKey("user-one")) ?? "{}"),
    {
      schemaVersion: 1,
      userId: "user-one",
      data: {
        binding: {
          discordUserId: "discord-one",
          discordUsername: null,
        },
        pendingBindingCode: null,
      },
    },
  );
});

test("discord binding cache reads a browser storage snapshot", () => {
  const storage = new MemoryStorage();
  const expiresAt = new Date(Date.now() + 60_000).toISOString();

  clearDiscordBindingCache("user-one", storage);
  storage.setItem(
    discordBindingCacheKey("user-one"),
    JSON.stringify({
      schemaVersion: 1,
      userId: "user-one",
      data: {
        binding: null,
        pendingBindingCode: {
          value: "ABCD-EFGH-IJKL",
          expiresAt,
        },
      },
    }),
  );

  assert.deepEqual(readDiscordBindingCache("user-one", storage), {
    binding: null,
    pendingBindingCode: {
      value: "ABCD-EFGH-IJKL",
      expiresAt,
    },
  });
});

test("discord binding cache removes malformed browser storage", () => {
  const storage = new MemoryStorage();
  const key = discordBindingCacheKey("user-one");

  clearDiscordBindingCache("user-one", storage);
  storage.setItem(
    key,
    JSON.stringify({
      schemaVersion: 1,
      userId: "user-one",
      data: {
        binding: {},
        pendingBindingCode: null,
      },
    }),
  );

  assert.equal(readDiscordBindingCache("user-one", storage), null);
  assert.equal(storage.getItem(key), null);
});

test("discord binding cache drops expired pending codes", () => {
  const storage = new MemoryStorage();

  writeDiscordBindingCache(
    "user-one",
    {
      binding: null,
      pendingBindingCode: {
        value: "ABCD-EFGH-IJKL",
        expiresAt: new Date(Date.now() - 60_000).toISOString(),
      },
    },
    storage,
  );

  assert.deepEqual(readDiscordBindingCache("user-one", storage), {
    binding: null,
    pendingBindingCode: null,
  });
});

test("discord binding cache ignores blocked browser storage", () => {
  clearDiscordBindingCache("user-one");

  const storage = {
    getItem() {
      throw new Error("blocked");
    },
    removeItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };

  assert.equal(readDiscordBindingCache("user-one", storage), null);
  assert.doesNotThrow(() =>
    writeDiscordBindingCache(
      "user-one",
      {
        binding: null,
        pendingBindingCode: null,
      },
      storage,
    ),
  );
  assert.doesNotThrow(() => clearDiscordBindingCache("user-one", storage));
});

test("discord binding cache does not expose mutable snapshots", () => {
  clearDiscordBindingCache("user-one");

  writeDiscordBindingCache("user-one", {
    binding: null,
    pendingBindingCode: {
      value: "ABCD-EFGH-IJKL",
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
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
