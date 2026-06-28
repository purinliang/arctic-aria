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

export function normalizeDisplayName(displayName: string) {
  return displayName.trim();
}

function validateUsername(username: string): string | null {
  if (!username) {
    return "Username is required.";
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

  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!visibleAsciiPattern.test(password)) {
    return "Use visible ASCII characters only, with no spaces.";
  }

  return null;
}

function validateDisplayName(displayName: string): string | null {
  const normalized = normalizeDisplayName(displayName);

  if (!normalized) {
    return "Display name is required.";
  }

  if (normalized.length > 32) {
    return "Display name must be 32 characters or fewer.";
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
