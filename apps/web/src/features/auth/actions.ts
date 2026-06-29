"use server";

import { authService, type AuthActionResult } from "./server/auth-service";
import type { LoginInput, RegisterInput } from "./validation";

export async function registerUser(
  input: RegisterInput,
): Promise<AuthActionResult> {
  return authService.register(input);
}

export async function loginUser(input: LoginInput): Promise<AuthActionResult> {
  return authService.login(input);
}
