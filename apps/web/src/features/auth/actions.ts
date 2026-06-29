"use server";

import { cookies } from "next/headers";
import { authService, type AuthActionResult } from "./server/auth-service";
import {
  authSessionCookieName,
  authSessionMaxAgeSeconds,
  createAuthSessionToken,
  getAuthSessionSecret,
  readAuthSessionToken,
  type AuthSession,
} from "./server/session";
import type { LoginInput, RegisterInput } from "./validation";

async function setSessionCookie(result: AuthActionResult) {
  if (!result.ok) {
    return result;
  }

  const cookieStore = await cookies();
  const token = createAuthSessionToken(result.user, getAuthSessionSecret());

  cookieStore.set(authSessionCookieName, token, {
    httpOnly: true,
    maxAge: authSessionMaxAgeSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return result;
}

export async function registerUser(
  input: RegisterInput,
): Promise<AuthActionResult> {
  return setSessionCookie(await authService.register(input));
}

export async function loginUser(input: LoginInput): Promise<AuthActionResult> {
  return setSessionCookie(await authService.login(input));
}

export async function getCurrentUser(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(authSessionCookieName)?.value;

  return readAuthSessionToken(token, getAuthSessionSecret());
}

export async function logoutUser() {
  const cookieStore = await cookies();

  cookieStore.delete(authSessionCookieName);
}
