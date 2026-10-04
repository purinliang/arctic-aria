import assert from "node:assert/strict";
import test from "node:test";
import type { NeonQueryFunction } from "@neondatabase/serverless";
import { createAuthService } from "../server/auth-service.ts";
import { createPasswordChangeService } from "../server/password-change-service.ts";
import { PostgresUserRepository } from "../server/postgres-user-repository.ts";
import { InMemoryUserRepository } from "../server/user-repository.ts";
import {
  normalizePasswordChangeInput,
  validatePasswordChangeInput,
} from "../password-change-validation.ts";

test("password change verifies the current password and replaces the login credential", async () => {
  const users = new InMemoryUserRepository();
  const auth = createAuthService({ users, log: () => {} });
  const passwords = createPasswordChangeService({ users });
  const registered = await auth.register({
    username: "testusername",
    displayName: "",
    password: "testpassword",
    repeatPassword: "testpassword",
  });
  assert.ok(registered.ok);
  const input = {
    currentPassword: "wrongpassword",
    newPassword: "testpassword2",
    repeatPassword: "testpassword2",
  };
  const wrong = await passwords.changePassword(registered.user.id, input);
  assert.equal(wrong.ok, false);
  assert.equal(wrong.code, "password_current_incorrect");
  assert.equal((await auth.login({ username: "testusername", password: "testpassword" })).ok, true);

  const changed = await passwords.changePassword(registered.user.id, {
    ...input,
    currentPassword: "testpassword",
  });
  assert.equal(changed.ok, true);
  assert.equal((await auth.login({ username: "testusername", password: "testpassword" })).ok, false);
  assert.equal((await auth.login({ username: "testusername", password: "testpassword2" })).ok, true);
  const stored = await users.findById(registered.user.id);
  assert.ok(stored);
  assert.notEqual(stored.passwordHash, input.newPassword);
  assert.match(stored.passwordHash, /^\$2/);
  assert.equal((await passwords.changePassword("missing-user", input)).code, "password_change_unauthorized");
});

test("password change validates confirmation, format, and untrusted payloads", async () => {
  const passwords = createPasswordChangeService({ users: new InMemoryUserRepository() });
  const result = await passwords.changePassword("missing-user", {
    currentPassword: "testpassword",
    newPassword: "testpassword2",
    repeatPassword: "testpassword3",
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.fieldErrors?.repeatPassword, "password_mismatch");
  const empty = await passwords.changePassword("missing-user", null);
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.equal(empty.fieldErrors?.currentPassword, "password_required");
  const normalized = normalizePasswordChangeInput({
    currentPassword: " testpassword ",
    newPassword: " demo123456+ ",
    repeatPassword: " demo123456+ ",
  });
  assert.deepEqual(validatePasswordChangeInput(normalized), {});
  assert.equal(validatePasswordChangeInput({ ...normalized, newPassword: "short" }).newPassword, "password_too_short");
  assert.equal(validatePasswordChangeInput({ ...normalized, newPassword: "a".repeat(33) }).newPassword, "password_too_long");
  assert.equal(validatePasswordChangeInput({ ...normalized, newPassword: "has space" }).newPassword, "password_invalid_format");
});

test("concurrent password changes cannot both replace the same verified hash", async () => {
  const users = new InMemoryUserRepository();
  const user = await users.create({
    username: "testusername",
    displayName: "testdisplayname",
    passwordHash: "hash:testpassword",
  });
  let hashCount = 0;
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const passwords = createPasswordChangeService({
    users,
    passwordHasher: {
      async verify(password, hash) { return hash === `hash:${password}`; },
      async hash(password) {
        hashCount += 1;
        if (hashCount === 2) release();
        await barrier;
        return `hash:${password}`;
      },
    },
  });
  const results = await Promise.all(["testpassword2", "testpassword3"].map((newPassword) =>
    passwords.changePassword(user.id, {
      currentPassword: "testpassword",
      newPassword,
      repeatPassword: newPassword,
    }),
  ));
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(results.filter((result) => result.code === "password_current_incorrect").length, 1);
});

test("Postgres password update checks both account ownership and the verified hash", async () => {
  let text = "";
  let parameters: unknown[] = [];
  const sql = (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    text = strings.join("?");
    parameters = values;
    return [{ id: "user-1" }];
  }) as unknown as NeonQueryFunction<false, false>;
  const users = new PostgresUserRepository(sql);
  assert.equal(await users.replacePasswordHash({
    userId: "user-1",
    expectedPasswordHash: "old-hash",
    passwordHash: "new-hash",
  }), true);
  assert.match(text, /WHERE id = \? AND password_hash = \?/);
  assert.deepEqual(parameters, ["new-hash", "user-1", "old-hash"]);
});
