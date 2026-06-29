import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthUser } from "./auth-service.ts";

export const authSessionCookieName = "arctic_aria_session";
export const authSessionMaxAgeSeconds = 60 * 60 * 24 * 30;

export type AuthSession = AuthUser & {
  expiresAt: number;
};

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function signaturesMatch(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

function isSessionPayload(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<AuthSession>;

  return (
    typeof payload.id === "string" &&
    typeof payload.username === "string" &&
    typeof payload.displayName === "string" &&
    typeof payload.expiresAt === "number"
  );
}

export function createAuthSessionToken(
  user: AuthUser,
  secret: string,
  now = Date.now(),
) {
  const payload: AuthSession = {
    ...user,
    expiresAt: now + authSessionMaxAgeSeconds * 1000,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function readAuthSessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): AuthSession | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature, extra] = token.split(".");

  if (!encodedPayload || !signature || extra !== undefined) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload, secret);

  if (!signaturesMatch(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as unknown;

    if (!isSessionPayload(payload) || payload.expiresAt <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getAuthSessionSecret() {
  return (
    process.env.AUTH_SESSION_SECRET ??
    process.env.NEON_POSTGRES_URL ??
    process.env.NEON_DATABASE_URL ??
    process.env.DATABASE_URL ??
    "arctic-aria-development-session-secret"
  );
}
