import assert from "node:assert/strict";
import test from "node:test";
import {
  developerModeStorageKey,
  readDeveloperModeStorage,
  writeDeveloperModeStorage,
} from "../developer-mode.ts";

class MemoryStorage {
  values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

test("developer mode storage reads only the true flag as enabled", () => {
  const storage = new MemoryStorage();

  assert.equal(readDeveloperModeStorage(storage), false);

  storage.setItem(developerModeStorageKey, "true");
  assert.equal(readDeveloperModeStorage(storage), true);

  storage.setItem(developerModeStorageKey, "false");
  assert.equal(readDeveloperModeStorage(storage), false);
});

test("developer mode storage writes boolean flags", () => {
  const storage = new MemoryStorage();

  writeDeveloperModeStorage(storage, true);
  assert.equal(storage.getItem(developerModeStorageKey), "true");

  writeDeveloperModeStorage(storage, false);
  assert.equal(storage.getItem(developerModeStorageKey), "false");
});

test("developer mode storage falls back when storage is unavailable", () => {
  const blockedStorage = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };

  assert.equal(readDeveloperModeStorage(blockedStorage), false);
  assert.doesNotThrow(() => writeDeveloperModeStorage(blockedStorage, true));
});
