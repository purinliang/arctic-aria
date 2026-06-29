"use server";

import {
  hasAuthErrors,
  normalizeLoginInput,
  normalizeRegisterInput,
  normalizeDisplayName,
  validateLoginTyping,
  validateRegisterTyping,
  type AuthFieldErrors,
  type LoginInput,
  type RegisterInput,
} from "./validation";

type DummyUserRecord = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
};

type AuthActionResult =
  | {
      ok: true;
      message: string;
      displayName: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: AuthFieldErrors;
    };

const dummyUsersTable: DummyUserRecord[] = [];

function logAuthEvent(event: string, details: Record<string, unknown>) {
  console.log("[auth]", event, details);
}

export async function registerUser(
  input: RegisterInput,
): Promise<AuthActionResult> {
  const normalizedInput = normalizeRegisterInput(input);
  const fieldErrors = validateRegisterTyping(normalizedInput);

  if (hasAuthErrors(fieldErrors)) {
    logAuthEvent("register_validation_failed", {
      username: normalizedInput.username,
      fields: Object.keys(fieldErrors),
    });

    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const usernameTaken = dummyUsersTable.some(
    (user) => user.username === normalizedInput.username,
  );

  if (usernameTaken) {
    logAuthEvent("register_username_taken", { username: normalizedInput.username });

    return {
      ok: false,
      message: "Username is already taken.",
      fieldErrors: { username: "Username is already taken." },
    };
  }

  logAuthEvent("register_success", { username: normalizedInput.username });

  return {
    ok: true,
    message: "Account created. Opening dashboard...",
    displayName: normalizeDisplayName(normalizedInput.displayName),
  };
}

export async function loginUser(input: LoginInput): Promise<AuthActionResult> {
  const normalizedInput = normalizeLoginInput(input);
  const fieldErrors = validateLoginTyping(normalizedInput);

  if (hasAuthErrors(fieldErrors)) {
    logAuthEvent("login_validation_failed", {
      username: normalizedInput.username,
      fields: Object.keys(fieldErrors),
    });

    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const user = dummyUsersTable.find(
    (record) => record.username === normalizedInput.username,
  );

  if (!user) {
    logAuthEvent("login_failed", { username: normalizedInput.username });

    return {
      ok: false,
      message: "Invalid username or password.",
    };
  }

  logAuthEvent("login_success", { username: normalizedInput.username });

  return {
    ok: true,
    message: "Signed in. Opening dashboard...",
    displayName: user.displayName,
  };
}
