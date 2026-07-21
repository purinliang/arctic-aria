import { NextResponse } from "next/server";
import { authorizeDeveloperApi } from "@/features/developer/server/developer-api-auth";
import { getCurrentUser } from "@/features/auth/actions";
import { projectDatabaseErrorCode } from "../project-database-errors";
import { normalizeProjectImportDocument } from "../project-import-normalizer";
import { parseProjectJsonToDocument } from "../project-import-parser";
import { projectService } from "./project-service";

export async function handleProjectImportRoute(request: Request) {
  const unauthorized = await authorizeDeveloperApi();

  if (unauthorized) {
    return unauthorized;
  }
  const user = await getCurrentUser();

  if (!user) {
    return noStoreJson(
      {
        ok: false,
        code: "developer_unauthorized",
        message: "Sign in before using developer tools.",
      },
      401,
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return noStoreJson(
      {
        ok: false,
        code: "project_import_invalid",
        message: "Request body must be valid JSON.",
        category: "invalid_parameter",
        subject: "project",
        field: "body",
        reason: "invalid_format",
      },
      400,
    );
  }

  const parsed = parseProjectJsonToDocument(body);

  if (!parsed.ok) {
    return noStoreJson(parsed, 400);
  }

  const normalized = normalizeProjectImportDocument(parsed.data, todayKey());

  if (!normalized.ok) {
    return noStoreJson(normalized, 400);
  }

  try {
    const projectId = await projectService.importProjectTree(user.id, normalized.data);

    if (!projectId) {
      return noStoreJson(
        {
          ok: false,
          code: "project_import_failed",
          message: "Project import could not be saved.",
          category: "database_update",
          action: "add",
          subject: "project",
        },
        500,
      );
    }

    return noStoreJson({
      ok: true,
      projectId,
    });
  } catch (error) {
    console.error("[projects]", "developer_project_import_failed", {
      code: safeErrorCode(error),
    });

    return noStoreJson(
      {
        ok: false,
        code: projectDatabaseErrorCode(error),
        message: "Project import could not be saved.",
        category: "database_update",
        action: "add",
        subject: "project",
      },
      500,
    );
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function safeErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String((error as { code?: unknown }).code)
    : "unknown";
}

function noStoreJson(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
