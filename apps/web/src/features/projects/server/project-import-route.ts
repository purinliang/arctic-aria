import { NextResponse } from "next/server";
import { authorizeDeveloperApi } from "@/features/developer/server/developer-api-auth";
import { readDeveloperImportRequest } from "@/features/developer/server/import-request-parser";
import { getCurrentUser } from "@/features/auth/actions";
import { projectDatabaseErrorCode } from "../project-database-errors";
import { normalizeProjectImportDocument } from "../project-import-normalizer";
import {
  parseProjectJsonToDocument,
  parseProjectMarkdownToJson,
} from "../project-import-parser";
import type {
  ProjectImportDocument,
  ProjectImportResult,
} from "../project-import-types";
import { projectService } from "./project-service";

export async function handleProjectParseRoute(request: Request) {
  const unauthorized = await authorizeDeveloperApi();

  if (unauthorized) {
    return unauthorized;
  }

  const prepared = await prepareProjectImport(request);

  if (!prepared.ok) {
    return noStoreJson(prepared, 400);
  }

  return noStoreJson({
    ok: true,
    document: prepared.document,
    project: prepared.project,
  });
}

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

  const prepared = await prepareProjectImport(request);

  if (!prepared.ok) {
    return noStoreJson(prepared, 400);
  }

  try {
    const projectId = await projectService.importProjectTree(
      user.id,
      prepared.project,
    );

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

async function prepareProjectImport(request: Request) {
  const importRequest = await readDeveloperImportRequest(request, "project");

  if (!importRequest.ok) {
    return importRequest;
  }

  const parsed =
    importRequest.data.format === "markdown"
      ? parseProjectMarkdownToDocument(importRequest.data.value)
      : parseProjectJsonToDocument(importRequest.data.value);

  if (!parsed.ok) {
    return parsed;
  }

  const normalized = normalizeProjectImportDocument(parsed.data, todayKey());

  if (!normalized.ok) {
    return normalized;
  }

  return {
    ok: true as const,
    document: parsed.data,
    project: normalized.data,
  };
}

function parseProjectMarkdownToDocument(
  markdown: string,
): ProjectImportResult<ProjectImportDocument> {
  const parsed = parseProjectMarkdownToJson(markdown);

  if (!parsed.ok) {
    return parsed;
  }

  return parseProjectJsonToDocument(parsed.data);
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
