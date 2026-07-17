"use server";

import { cookies } from "next/headers";
import type { DatabaseVersionStatus } from "@/components/app-metadata";
import { getDatabaseVersionStatus } from "@/server/database/migration-status";
import {
  authSessionCookieName,
  getAuthSessionSecret,
  readAuthSessionToken,
  type AuthSession,
} from "./server/session";

export async function getCurrentUser(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(authSessionCookieName)?.value;

  return readAuthSessionToken(token, getAuthSessionSecret());
}

export async function logoutUser() {
  const cookieStore = await cookies();

  cookieStore.delete(authSessionCookieName);
}

export async function getPublicVersionStatus(): Promise<DatabaseVersionStatus> {
  return getDatabaseVersionStatus();
}
