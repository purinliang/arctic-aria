import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeRegisterInput,
  validateLoginSubmit,
  validateLoginTyping,
  validateRegisterSubmit,
  validateRegisterTyping,
} from "../validation.ts";

test("register validation enforces username and password rules", () => {
  const errors = validateRegisterTyping({
    username: "abc",
    displayName: "",
    password: "short",
    repeatPassword: "different",
  });

  assert.equal(errors.username, "Username must be at least 4 characters.");
  assert.equal(errors.password, "Password must be at least 8 characters.");
  assert.equal(errors.repeatPassword, "Passwords must match.");
  assert.equal(errors.displayName, undefined);
});

test("register validation accepts optional display name", () => {
  const errors = validateRegisterTyping({
    username: "purin",
    displayName: "",
    password: "password1",
    repeatPassword: "password1",
  });

  assert.deepEqual(errors, {});
});

test("typing validation does not reject empty required fields", () => {
  const registerErrors = validateRegisterTyping({
    username: "",
    displayName: "",
    password: "",
    repeatPassword: "",
  });
  const loginErrors = validateLoginTyping({ username: "", password: "" });

  assert.deepEqual(registerErrors, {});
  assert.deepEqual(loginErrors, {});
});

test("submit validation rejects empty required fields", () => {
  const registerErrors = validateRegisterSubmit({
    username: "",
    displayName: "",
    password: "",
    repeatPassword: "",
  });
  const loginErrors = validateLoginSubmit({ username: "", password: "" });

  assert.equal(registerErrors.username, "Username can't be empty.");
  assert.equal(registerErrors.password, "Password can't be empty.");
  assert.equal(registerErrors.repeatPassword, "Repeat password can't be empty.");
  assert.equal(loginErrors.username, "Username can't be empty.");
  assert.equal(loginErrors.password, "Password can't be empty.");
});

test("register validation enforces maximum field lengths", () => {
  const errors = validateRegisterTyping({
    username: "p".repeat(17),
    displayName: "P".repeat(25),
    password: "p".repeat(33),
    repeatPassword: "p".repeat(33),
  });

  assert.equal(errors.username, "Username must be 16 characters or fewer.");
  assert.equal(errors.displayName, "Display name must be 24 characters or fewer.");
  assert.equal(errors.password, "Password must be 32 characters or fewer.");
  assert.equal(errors.repeatPassword, undefined);
});

test("register normalization trims fields and falls back display name to username", () => {
  const input = normalizeRegisterInput({
    username: " purin ",
    displayName: "   ",
    password: " password1 ",
    repeatPassword: " password1 ",
  });

  assert.deepEqual(input, {
    username: "purin",
    displayName: "purin",
    password: "password1",
    repeatPassword: "password1",
  });
});

test("login validation uses shared username and password rules", () => {
  const errors = validateLoginTyping({
    username: "bad name",
    password: "password1",
  });

  assert.equal(errors.username, "Use visible ASCII characters only, with no spaces.");
});
