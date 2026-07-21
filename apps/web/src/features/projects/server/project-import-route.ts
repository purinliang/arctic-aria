import { NextResponse } from "next/server";
import { authorizeDeveloperApi } from "@/features/developer/server/developer-api-auth";
import { readDeveloperImportRequest } from "@/features/developer/server/import-request-parser";
import { getCurrentUser } from "@/features/auth/actions";
import { projectDatabaseErrorCode } from "../project-database-errors";
import { normalizeProjectImportDocument } from "../project-import-normalizer";
import {
  parseProjectJsonToDocuments,
  parseProjectMarkdownToDocuments,
} from "../project-import-parser";
import type {
  ProjectImportBatchDocument,
  ProjectImportCommand,
  ProjectImportDocument,
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
    documents: prepared.documents,
    project: prepared.projects[0] ?? null,
    projects: prepared.projects,
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
    const projectIds = [];

    for (const project of prepared.projects) {
      const projectId = await projectService.importProjectTree(
        user.id,
        project,
      );

      if (!projectId) {
        return projectImportFailed("project_import_failed");
      }

      projectIds.push(projectId);
    }

    return noStoreJson({
      ok: true,
      projectId: projectIds[0] ?? null,
      projectIds,
      importedCount: projectIds.length,
    });
  } catch (error) {
    console.error("[projects]", "developer_project_import_failed", {
      code: safeErrorCode(error),
    });

    return projectImportFailed(projectDatabaseErrorCode(error));
  }
}

async function prepareProjectImport(request: Request) {
  const importRequest = await readDeveloperImportRequest(request, "project");

  if (!importRequest.ok) {
    return importRequest;
  }

  const parsed =
    importRequest.data.format === "markdown"
      ? parseProjectMarkdownToDocuments(importRequest.data.value)
      : parseProjectJsonToDocuments(importRequest.data.value);

  if (!parsed.ok) {
    return parsed;
  }

  const projects: ProjectImportCommand[] = [];

  for (const document of parsed.data.projects) {
    const normalized = normalizeProjectImportDocument(document, todayKey());

    if (!normalized.ok) {
      return normalized;
    }

    projects.push(normalized.data);
  }

  return {
    ok: true as const,
    document: documentForResponse(parsed.data),
    documents: parsed.data.projects,
    projects,
  };
}

function documentForResponse(
  document: ProjectImportBatchDocument,
): ProjectImportDocument | ProjectImportBatchDocument {
  const firstProject = document.projects[0];

  if (document.projects.length === 1 && firstProject) {
    return firstProject;
  }

  return document;
}

function projectImportFailed(code: string) {
  return noStoreJson(
    {
      ok: false,
      code,
      message: "Project import could not be saved.",
      category: "database_update",
      action: "add",
      subject: "project",
    },
    500,
  );
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
