import { NextResponse } from "next/server";
import { authorizeDeveloperApi } from "@/features/developer/server/developer-api-auth";
import { readDeveloperImportRequest } from "@/features/developer/server/import-request-parser";
import { getCurrentUser } from "@/features/auth/actions";
import { normalizeRoutineImportDocument } from "../routine-import-normalizer";
import {
  parseRoutineJsonToDocument,
  parseRoutineMarkdownToJson,
} from "../routine-import-parser";
import type {
  RoutineImportDocument,
  RoutineImportResult,
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
    routine: prepared.routine,
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
    const routine = await routineService.saveRoutine(user.id, prepared.routine);

    if (!routine) {
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

    return noStoreJson({
      ok: true,
      routineId: routine.id,
    });
  } catch {
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
}

async function prepareRoutineImport(request: Request) {
  const importRequest = await readDeveloperImportRequest(request, "routine");

  if (!importRequest.ok) {
    return importRequest;
  }

  const parsed =
    importRequest.data.format === "markdown"
      ? parseRoutineMarkdownToDocument(importRequest.data.value)
      : parseRoutineJsonToDocument(importRequest.data.value);

  if (!parsed.ok) {
    return parsed;
  }

  const normalized = normalizeRoutineImportDocument(parsed.data, todayKey());

  if (!normalized.ok) {
    return normalized;
  }

  return {
    ok: true as const,
    document: parsed.data,
    routine: normalized.data,
  };
}

function parseRoutineMarkdownToDocument(
  markdown: string,
): RoutineImportResult<RoutineImportDocument> {
  const parsed = parseRoutineMarkdownToJson(markdown);

  if (!parsed.ok) {
    return parsed;
  }

  return parseRoutineJsonToDocument(parsed.data);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function noStoreJson(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
