import { ApiError } from "@google/genai/node";

const providerStatuses = new Set([
  "CANCELLED", "UNKNOWN", "INVALID_ARGUMENT", "DEADLINE_EXCEEDED", "NOT_FOUND",
  "ALREADY_EXISTS", "PERMISSION_DENIED", "UNAUTHENTICATED", "RESOURCE_EXHAUSTED",
  "FAILED_PRECONDITION", "ABORTED", "OUT_OF_RANGE", "UNIMPLEMENTED", "INTERNAL",
  "UNAVAILABLE", "DATA_LOSS",
]);

export function connectionTestErrorResponse(error: unknown, apiKey: string) {
  if (!(error instanceof ApiError) || !apiKey) return undefined;
  try {
    const body = JSON.parse(error.message);
    const details = body?.error;
    if (!details || typeof details.message !== "string") return undefined;
    // Retain Google's message, not credential-bearing headers, metadata or stack.
    const message = details.message
      .replaceAll(apiKey, "[redacted]")
      .replaceAll(encodeURIComponent(apiKey), "[redacted]")
      .replace(/https?:\/\/[^\s"'<>]+/gi, "[redacted URL]")
      .replace(/\bBearer\s+[^\s"']+/gi, "Bearer [redacted]")
      .replace(/\bAIza[\w-]{20,}|\bAQ\.[\w.-]+/g, "[redacted]")
      .replace(/\bprojects\/[\w.:-]+/g, "projects/[redacted]")
      .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[redacted email]")
      .slice(0, 4_000);
    return { error: {
      code: error.status,
      status: providerStatuses.has(details.status) ? details.status : undefined,
      message,
    } };
  } catch {
    return undefined;
  }
}
