export type AuthField = "username" | "displayName" | "password" | "repeatPassword";

export type AuthFieldErrors = Partial<Record<AuthField, string>>;

export type RegisterInput = {
  username: string;
  displayName: string;
  password: string;
  repeatPassword: string;
};

export type LoginInput = {
  username: string;
  password: string;
};

const visibleAsciiPattern = /^[!-~]+$/;
const minimumUsernameLength = 4;
const maximumUsernameLength = 16;
const minimumPasswordLength = 8;
const maximumPasswordLength = 32;
const minimumDisplayNameLength = 1;
const maximumDisplayNameLength = 24;

export const authFieldOrder: AuthField[] = [
  "username",
  "displayName",
  "password",
  "repeatPassword",
];

export function normalizeDisplayName(displayName: string) {
  return displayName.trim();
}

export function normalizeRegisterInput(input: RegisterInput): RegisterInput {
  const username = input.username.trim();
  const displayName = normalizeDisplayName(input.displayName);

  return {
    username,
    displayName: displayName || username,
    password: input.password.trim(),
    repeatPassword: input.repeatPassword.trim(),
  };
}

export function normalizeLoginInput(input: LoginInput): LoginInput {
  return {
    username: input.username.trim(),
    password: input.password.trim(),
  };
}

function validateUsername(username: string): string | null {
  if (!username) {
    return "Username is required.";
  }

  if (username.length < minimumUsernameLength) {
    return "Username must be at least 4 characters.";
  }

  if (username.length > maximumUsernameLength) {
    return "Username must be 16 characters or fewer.";
  }

  if (!visibleAsciiPattern.test(username)) {
    return "Use visible ASCII characters only, with no spaces.";
  }

  return null;
}

function validatePassword(password: string): string | null {
  if (!password) {
    return "Password is required.";
  }

  if (password.length < minimumPasswordLength) {
    return "Password must be at least 8 characters.";
  }

  if (password.length > maximumPasswordLength) {
    return "Password must be 32 characters or fewer.";
  }

  if (!visibleAsciiPattern.test(password)) {
    return "Use visible ASCII characters only, with no spaces.";
  }

  return null;
}

function validateDisplayName(displayName: string): string | null {
  const normalized = normalizeDisplayName(displayName);

  if (!normalized) {
    return null;
  }

  if (normalized.length < minimumDisplayNameLength) {
    return "Display name must be at least 1 character.";
  }

  if (normalized.length > maximumDisplayNameLength) {
    return "Display name must be 24 characters or fewer.";
  }

  return null;
}

export function validateRegisterTyping(input: RegisterInput): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const usernameError = validateUsername(input.username);
  const displayNameError = validateDisplayName(input.displayName);
  const passwordError = validatePassword(input.password);

  if (usernameError) {
    errors.username = usernameError;
  }

  if (displayNameError) {
    errors.displayName = displayNameError;
  }

  if (passwordError) {
    errors.password = passwordError;
  }

  if (!input.repeatPassword) {
    errors.repeatPassword = "Repeat password is required.";
  } else if (input.password !== input.repeatPassword) {
    errors.repeatPassword = "Passwords must match.";
  }

  return errors;
}

export function validateLoginTyping(input: LoginInput): AuthFieldErrors {
  const errors: AuthFieldErrors = {};
  const usernameError = validateUsername(input.username);
  const passwordError = validatePassword(input.password);

  if (usernameError) {
    errors.username = usernameError;
  }

  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}

export function hasAuthErrors(errors: AuthFieldErrors) {
  return Object.values(errors).some(Boolean);
}
