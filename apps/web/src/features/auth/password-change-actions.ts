"use server";

import { getCurrentUser } from "./actions";
import { passwordChangeService } from "./server/password-change-service";
import type { PasswordChangeResult } from "./server/password-change-service";
import type { PasswordChangeInput } from "./password-change-validation";

export async function changePassword(input: PasswordChangeInput): Promise<PasswordChangeResult> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return {
        ok: false,
        code: "password_change_unauthorized",
        message: "Sign in before changing your password.",
        category: "auth",
      };
    }
    return await passwordChangeService.changePassword(user.id, input);
  } catch (error) {
    console.error("[auth]", "password_change_failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });
    return {
      ok: false,
      code: "password_change_server_failed",
      message: "Server internal error.",
      category: "server",
    };
  }
}
