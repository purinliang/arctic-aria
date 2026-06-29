import assert from "node:assert/strict";
import test from "node:test";
import { createAuthService } from "../server/auth-service.ts";
import {
  DuplicateUsernameError,
  InMemoryUserRepository,
  type CreateUserRecord,
  type UserRepository,
} from "../server/user-repository.ts";

function createTestService() {
  const users = new InMemoryUserRepository();

  return {
    service: createAuthService({
      users,
      log: () => {},
    }),
    users,
  };
}

test("register creates a user and login accepts the same credentials", async () => {
  const { service } = createTestService();

  const registerResult = await service.register({
    username: " purin ",
    displayName: "",
    password: " password1 ",
    repeatPassword: " password1 ",
  });

  assert.equal(registerResult.ok, true);

  if (registerResult.ok) {
    assert.equal(registerResult.displayName, "purin");
  }

  const loginResult = await service.login({
    username: "purin",
    password: "password1",
  });

  assert.equal(loginResult.ok, true);
});

test("register rejects duplicate usernames", async () => {
  const { service } = createTestService();

  await service.register({
    username: "purin",
    displayName: "Purin",
    password: "password1",
    repeatPassword: "password1",
  });

  const duplicateResult = await service.register({
    username: "purin",
    displayName: "Other",
    password: "password1",
    repeatPassword: "password1",
  });

  assert.equal(duplicateResult.ok, false);

  if (!duplicateResult.ok) {
    assert.equal(duplicateResult.fieldErrors?.username, "Username is already taken.");
  }
});

test("register handles duplicate username races from the repository", async () => {
  class RacingUserRepository implements UserRepository {
    async create(input: CreateUserRecord) {
      throw new DuplicateUsernameError(input.username);
    }

    async findByUsername() {
      return null;
    }
  }

  const service = createAuthService({
    users: new RacingUserRepository(),
    log: () => {},
  });

  const result = await service.register({
    username: "purin",
    displayName: "Purin",
    password: "password1",
    repeatPassword: "password1",
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.fieldErrors?.username, "Username is already taken.");
  }
});

test("login returns a generic error for invalid credentials", async () => {
  const { service } = createTestService();

  const result = await service.login({
    username: "purin",
    password: "password1",
  });

  assert.deepEqual(result, {
    ok: false,
    message: "Invalid username or password.",
  });
});

test("stored password hash does not contain the raw password", async () => {
  const { service, users } = createTestService();

  await service.register({
    username: "purin",
    displayName: "Purin",
    password: "password1",
    repeatPassword: "password1",
  });

  const user = await users.findByUsername("purin");

  assert.ok(user);
  assert.notEqual(user.passwordHash, "password1");
  assert.match(user.passwordHash, /^\$2[aby]\$/);
});
