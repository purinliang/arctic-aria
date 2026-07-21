import type { ActionFailureResult } from "@/messages/action-result";

type ImportFormat = "json" | "markdown";

export type DeveloperImportRequest =
  | {
      format: "json";
      value: unknown;
    }
  | {
      format: "markdown";
      value: string;
    };

export type DeveloperImportRequestResult =
  | {
      ok: true;
      data: DeveloperImportRequest;
    }
  | ActionFailureResult;

export async function readDeveloperImportRequest(
  request: Request,
  subject: "project" | "routine",
): Promise<DeveloperImportRequestResult> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("text/markdown") || contentType.includes("text/plain")) {
    return {
      ok: true,
      data: {
        format: "markdown",
        value: await request.text(),
      },
    };
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return invalidBody(subject, "Request body must be valid JSON or Markdown text.");
  }

  if (isRecord(body) && ("format" in body || "source" in body)) {
    return readEnvelope(body, subject);
  }

  return {
    ok: true,
    data: {
      format: "json",
      value: body,
    },
  };
}

function readEnvelope(
  body: Record<string, unknown>,
  subject: "project" | "routine",
): DeveloperImportRequestResult {
  const format = body.format;

  if (format !== "json" && format !== "markdown") {
    return invalidField(
      subject,
      "format",
      "format must be json or markdown.",
    );
  }

  if (format === "markdown") {
    if (typeof body.source !== "string") {
      return invalidField(
        subject,
        "source",
        "source must be Markdown text when format is markdown.",
      );
    }

    return {
      ok: true,
      data: {
        format,
        value: body.source,
      },
    };
  }

  if (typeof body.source === "string") {
    try {
      return {
        ok: true,
        data: {
          format,
          value: JSON.parse(body.source),
        },
      };
    } catch {
      return invalidField(subject, "source", "source must be valid JSON text.");
    }
  }

  if (body.source === undefined) {
    return invalidField(subject, "source", "source is required.");
  }

  return {
    ok: true,
    data: {
      format,
      value: body.source,
    },
  };
}

function invalidBody(subject: "project" | "routine", message: string) {
  return {
    ok: false,
    code: `${subject}_import_invalid`,
    message,
    category: "invalid_parameter",
    subject,
    field: "body",
    reason: "invalid_format",
  } satisfies ActionFailureResult;
}

function invalidField(
  subject: "project" | "routine",
  field: string,
  message: string,
) {
  return {
    ok: false,
    code: `${subject}_import_invalid`,
    message,
    category: "invalid_parameter",
    subject,
    field,
    reason: "invalid_value",
  } satisfies ActionFailureResult;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
