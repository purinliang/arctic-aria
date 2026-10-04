import { passwordValidationReason } from "./validation.ts";

export type PasswordChangeInput = {
  currentPassword: string;
  newPassword: string;
  repeatPassword: string;
};
export type PasswordChangeField = keyof PasswordChangeInput;
export type PasswordChangeError =
  | NonNullable<ReturnType<typeof passwordValidationReason>>
  | "password_mismatch";
export type PasswordChangeErrors = Partial<Record<PasswordChangeField, PasswordChangeError>>;

export function normalizePasswordChangeInput(input: unknown): PasswordChangeInput {
  const record = input && typeof input === "object"
    ? input as Record<string, unknown>
    : {};
  const read = (key: PasswordChangeField) => {
    const value = record[key];
    return typeof value === "string" ? value.trim() : "";
  };
  return {
    currentPassword: read("currentPassword"),
    newPassword: read("newPassword"),
    repeatPassword: read("repeatPassword"),
  };
}

export function validatePasswordChangeInput(input: PasswordChangeInput) {
  const errors: PasswordChangeErrors = {};
  for (const field of ["currentPassword", "newPassword", "repeatPassword"] as const) {
    const reason = passwordValidationReason(input[field]);
    if (reason) errors[field] = reason;
  }
  if (!errors.repeatPassword && input.newPassword !== input.repeatPassword) {
    errors.repeatPassword = "password_mismatch";
  }
  return errors;
}
