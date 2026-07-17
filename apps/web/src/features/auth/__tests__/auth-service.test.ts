import assert from "node:assert/strict";
import test from "node:test";
import { createAuthService } from "../server/auth-service.ts";
import {
  DuplicateUsernameError,
  InMemoryUserRepository,
  type CreateUserRecord,
  type UserRepository,
} from "../server/user-repository.ts";

const testUsername = "testusername";
const testDisplayName = "testdisplayname";
const testPassword = "testpassword";
const wrongTestPassword = "wrongtestpassword";

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

test("auth logs do not include credential or identity values", async () => {
  const users = new InMemoryUserRepository();
  const logs: Array<{
    event: string;
    details?: Record<string, unknown>;
  }> = [];
  const service = createAuthService({
    users,
    log: (event, details) => {
      logs.push({ event, details });
    },
  });

  await service.register({
    username: testUsername,
    displayName: testDisplayName,
    password: testPassword,
    repeatPassword: testPassword,
  });
  await service.register({
    username: testUsername,
    displayName: "otherdisplayname",
    password: testPassword,
    repeatPassword: testPassword,
  });
  await service.login({
    username: testUsername,
    password: wrongTestPassword,
  });
  await service.login({
    username: testUsername,
    password: testPassword,
  });

  assert.ok(logs.length > 0);

  for (const { details } of logs) {
    const serializedDetails = JSON.stringify(details ?? {});

    assert.equal(details?.username, undefined);
    assert.equal(details?.password, undefined);
    assert.equal(details?.repeatPassword, undefined);
    assert.equal(details?.displayName, undefined);
    assert.doesNotMatch(serializedDetails, new RegExp(testUsername, "i"));
    assert.doesNotMatch(serializedDetails, new RegExp(testPassword, "i"));
    assert.doesNotMatch(serializedDetails, new RegExp(wrongTestPassword, "i"));
    assert.doesNotMatch(serializedDetails, new RegExp(testDisplayName, "i"));
    assert.doesNotMatch(serializedDetails, /otherdisplayname/i);
  }
});

test("register creates a user and login accepts the same credentials", async () => {
  const { service } = createTestService();

  const registerResult = await service.register({
    username: ` ${testUsername} `,
    displayName: "",
    password: ` ${testPassword} `,
    repeatPassword: ` ${testPassword} `,
  });

  assert.equal(registerResult.ok, true);

  if (registerResult.ok) {
    assert.equal(registerResult.displayName, testUsername);
  }

  const loginResult = await service.login({
    username: testUsername,
    password: testPassword,
  });

  assert.equal(loginResult.ok, true);
});

test("register rejects duplicate usernames", async () => {
  const { service } = createTestService();

  await service.register({
    username: testUsername,
    displayName: testDisplayName,
    password: testPassword,
    repeatPassword: testPassword,
  });

  const duplicateResult = await service.register({
    username: testUsername,
    displayName: "otherdisplayname",
    password: testPassword,
    repeatPassword: testPassword,
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
    username: testUsername,
    displayName: testDisplayName,
    password: testPassword,
    repeatPassword: testPassword,
  });

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.fieldErrors?.username, "Username is already taken.");
  }
});

test("login returns a generic error for invalid credentials", async () => {
  const { service } = createTestService();

  const result = await service.login({
    username: testUsername,
    password: testPassword,
  });

  assert.deepEqual(result, {
    ok: false,
    code: "auth_invalid_credentials",
    message: "Invalid username or password.",
  });
});

test("stored password hash does not contain the raw password", async () => {
  const { service, users } = createTestService();

  await service.register({
    username: testUsername,
    displayName: testDisplayName,
    password: testPassword,
    repeatPassword: testPassword,
  });

  const user = await users.findByUsername(testUsername);

  assert.ok(user);
  assert.notEqual(user.passwordHash, testPassword);
  assert.match(user.passwordHash, /^\$2[aby]\$/);
});
