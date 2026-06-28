"use server";

import {
  hasAuthErrors,
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
  const fieldErrors = validateRegisterTyping(input);

  if (hasAuthErrors(fieldErrors)) {
    logAuthEvent("register_validation_failed", {
      username: input.username,
      fields: Object.keys(fieldErrors),
    });

    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const usernameTaken = dummyUsersTable.some(
    (user) => user.username === input.username,
  );

  if (usernameTaken) {
    logAuthEvent("register_username_taken", { username: input.username });

    return {
      ok: false,
      message: "Username is already taken.",
      fieldErrors: { username: "Username is already taken." },
    };
  }

  logAuthEvent("register_success", { username: input.username });

  return {
    ok: true,
    message: "Account created. Opening dashboard...",
    displayName: normalizeDisplayName(input.displayName),
  };
}

export async function loginUser(input: LoginInput): Promise<AuthActionResult> {
  const fieldErrors = validateLoginTyping(input);

  if (hasAuthErrors(fieldErrors)) {
    logAuthEvent("login_validation_failed", {
      username: input.username,
      fields: Object.keys(fieldErrors),
    });

    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const user = dummyUsersTable.find((record) => record.username === input.username);

  if (!user) {
    logAuthEvent("login_failed", { username: input.username });

    return {
      ok: false,
      message: "Invalid username or password.",
    };
  }

  logAuthEvent("login_success", { username: input.username });

  return {
    ok: true,
    message: "Signed in. Opening dashboard...",
    displayName: user.displayName,
  };
}
