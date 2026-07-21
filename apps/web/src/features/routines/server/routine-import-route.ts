import { NextResponse } from "next/server";
import { authorizeDeveloperApi } from "@/features/developer/server/developer-api-auth";
import { loadDeveloperImportDefaults } from "@/features/developer/server/import-defaults";
import { readDeveloperImportRequest } from "@/features/developer/server/import-request-parser";
import { getCurrentUser } from "@/features/auth/actions";
import { normalizeRoutineImportDocument } from "../routine-import-normalizer";
import {
  parseRoutineJsonToDocuments,
  parseRoutineMarkdownToDocuments,
} from "../routine-import-parser";
import type {
  RoutineImportBatchDocument,
  RoutineImportCommand,
  RoutineImportDocument,
} from "../routine-import-types";
import { routineService } from "./routine-service";

export async function handleRoutineParseRoute(request: Request) {
  const unauthorized = await authorizeDeveloperApi();

  if (unauthorized) {
    return unauthorized;
  }

  const prepared = await prepareRoutineImport(request);

  if (!prepared.ok) {
    return noStoreJson(prepared, 400);
  }

  return noStoreJson({
    ok: true,
    document: prepared.document,
    documents: prepared.documents,
    routine: prepared.routines[0] ?? null,
    routines: prepared.routines,
  });
}

export async function handleRoutineImportRoute(request: Request) {
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

  const prepared = await prepareRoutineImport(request);

  if (!prepared.ok) {
    return noStoreJson(prepared, 400);
  }

  try {
    const routines = [];

    for (const routineInput of prepared.routines) {
      const routine = await routineService.saveRoutine(user.id, routineInput);

      if (!routine) {
        return routineImportFailed();
      }

      routines.push(routine);
    }

    return noStoreJson({
      ok: true,
      routineId: routines[0]?.id ?? null,
      routineIds: routines.map((routine) => routine.id),
      importedCount: routines.length,
    });
  } catch {
    return routineImportFailed();
  }
}

async function prepareRoutineImport(request: Request) {
  const importRequest = await readDeveloperImportRequest(request, "routine");

  if (!importRequest.ok) {
    return importRequest;
  }

  const parsed =
    importRequest.data.format === "markdown"
      ? parseRoutineMarkdownToDocuments(importRequest.data.value)
      : parseRoutineJsonToDocuments(importRequest.data.value);

  if (!parsed.ok) {
    return parsed;
  }

  const documents: RoutineImportDocument[] = parsed.data.routines.map(
    (routine) => ({ routine }),
  );
  const routines: RoutineImportCommand[] = [];
  const defaults = await loadDeveloperImportDefaults();

  for (const document of documents) {
    const normalized = normalizeRoutineImportDocument(
      document,
      defaults.today,
      defaults.timeZone,
    );

    if (!normalized.ok) {
      return normalized;
    }

    routines.push(normalized.data);
  }

  return {
    ok: true as const,
    document: documentForResponse(parsed.data),
    documents,
    routines,
  };
}

function documentForResponse(
  document: RoutineImportBatchDocument,
): RoutineImportDocument | RoutineImportBatchDocument {
  const firstRoutine = document.routines[0];

  if (document.routines.length === 1 && firstRoutine) {
    return {
      routine: firstRoutine,
    };
  }

  return document;
}

function routineImportFailed() {
  return noStoreJson(
    {
      ok: false,
      code: "routine_import_failed",
      message: "Routine import could not be saved.",
      category: "database_update",
      action: "add",
      subject: "routine",
    },
    500,
  );
}

function noStoreJson(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
