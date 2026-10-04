import { bcryptPasswordHasher } from "./password.ts";
import type { PasswordHasher } from "./password.ts";
import { PostgresUserRepository } from "./postgres-user-repository.ts";
import type { UserRepository } from "./user-repository.ts";
import {
  normalizePasswordChangeInput,
  validatePasswordChangeInput,
} from "../password-change-validation.ts";
import type { PasswordChangeErrors } from "../password-change-validation.ts";
import type { ActionFailureResult } from "../../../messages/action-result.ts";

export type PasswordChangeResult =
  | { ok: true; code: "password_changed"; message: string }
  | (ActionFailureResult & { fieldErrors?: PasswordChangeErrors });

function incorrectPasswordResult(): PasswordChangeResult {
  return {
    ok: false,
    code: "password_current_incorrect",
    message: "Current password is incorrect. Please try again.",
    category: "domain",
  };
}

export function createPasswordChangeService(options: {
  users?: UserRepository;
  passwordHasher?: PasswordHasher;
} = {}) {
  const users = options.users ?? new PostgresUserRepository();
  const hasher = options.passwordHasher ?? bcryptPasswordHasher;

  return {
    async changePassword(userId: string, input: unknown): Promise<PasswordChangeResult> {
      const normalized = normalizePasswordChangeInput(input);
      const fieldErrors = validatePasswordChangeInput(normalized);
      if (Object.keys(fieldErrors).length > 0) {
        return {
          ok: false,
          code: "password_change_validation_failed",
          message: "Please fix the highlighted fields.",
          category: "invalid_parameter",
          fieldErrors,
        };
      }

      let user;
      try {
        user = await users.findById(userId);
      } catch {
        return {
          ok: false,
          code: "password_change_load_failed",
          message: "Database connection failed.",
          category: "database_connection",
        };
      }
      if (!user) {
        return {
          ok: false,
          code: "password_change_unauthorized",
          message: "Sign in before changing your password.",
          category: "auth",
        };
      }

      const expectedPasswordHash = user.passwordHash;
      if (!await hasher.verify(normalized.currentPassword, expectedPasswordHash)) {
        return incorrectPasswordResult();
      }
      const passwordHash = await hasher.hash(normalized.newPassword);
      try {
        const updated = await users.replacePasswordHash({
          userId,
          expectedPasswordHash,
          passwordHash,
        });
        if (!updated) return incorrectPasswordResult();
      } catch {
        return {
          ok: false,
          code: "password_change_save_failed",
          message: "Password could not be saved.",
          category: "database_update",
        };
      }
      return { ok: true, code: "password_changed", message: "Password changed successfully." };
    },
  };
}

export const passwordChangeService = createPasswordChangeService();
