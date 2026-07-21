import { NextResponse } from "next/server";
import { authService } from "./auth-service.ts";
import {
  authSessionCookieName,
  authSessionMaxAgeSeconds,
  createAuthSessionToken,
  getAuthSessionSecret,
} from "./session.ts";
import type { AuthActionResult } from "./auth-service.ts";
import type { LoginInput, RegisterInput } from "../validation.ts";

type AuthRouteMode = "login" | "register";

const invalidRequestResult: AuthActionResult = {
  ok: false,
  code: "auth_request_invalid",
  message: "Authentication request was invalid.",
};

const failedRequestResult: AuthActionResult = {
  ok: false,
  code: "auth_request_failed",
  message: "Server internal error.",
};

const databaseRequestResult: AuthActionResult = {
  ok: false,
  code: "auth_database_failed",
  message: "Database connection failed.",
};

export async function handleAuthRoute(request: Request, mode: AuthRouteMode) {
  try {
    const body = await readJsonBody(request);
    const result =
      mode === "register"
        ? await authService.register(toRegisterInput(body))
        : await authService.login(toLoginInput(body));

    return authResultResponse(result);
  } catch (error) {
    if (error instanceof AuthRequestBodyError) {
      return authResultResponse(invalidRequestResult, 400);
    }

    const result = isAuthDatabaseError(error)
      ? databaseRequestResult
      : failedRequestResult;

    console.error("[auth]", "request_failed", {
      command: mode,
      failureType:
        result.code === "auth_database_failed" ? "database" : "server",
      errorName: error instanceof Error ? error.name : "unknown",
    });

    return authResultResponse(result, 500);
  }
}

function authResultResponse(result: AuthActionResult, status = 200) {
  const response = NextResponse.json(result, { status });

  if (result.ok) {
    const token = createAuthSessionToken(result.user, getAuthSessionSecret());

    response.cookies.set(authSessionCookieName, token, {
      httpOnly: true,
      maxAge: authSessionMaxAgeSeconds,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

async function readJsonBody(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    throw new AuthRequestBodyError();
  }
}

function toLoginInput(body: unknown): LoginInput {
  const record = toRecord(body);

  return {
    username: readString(record, "username"),
    password: readString(record, "password"),
  };
}

function toRegisterInput(body: unknown): RegisterInput {
  const record = toRecord(body);

  return {
    username: readString(record, "username"),
    displayName: readString(record, "displayName"),
    password: readString(record, "password"),
    repeatPassword: readString(record, "repeatPassword"),
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AuthRequestBodyError();
  }

  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" ? value : "";
}

function isAuthDatabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message).toLowerCase() : "";

  return (
    /^[0-9A-Z]{5}$/.test(code) ||
    message.includes("database") ||
    message.includes("postgres") ||
    message.includes("neon") ||
    message.includes("connection") ||
    message.includes("fetch failed") ||
    message.includes("missing database url")
  );
}

class AuthRequestBodyError extends Error {
  constructor() {
    super("Invalid auth request body.");
  }
}
