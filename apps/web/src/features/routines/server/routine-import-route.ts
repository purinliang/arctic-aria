import { NextResponse } from "next/server";
import { authorizeDeveloperApi } from "@/features/developer/server/developer-api-auth";
import { normalizeRoutineImportDocument } from "../routine-import-normalizer";
import { parseRoutineJsonToDocument } from "../routine-import-parser";

export async function handleRoutineParseRoute(request: Request) {
  const unauthorized = await authorizeDeveloperApi();

  if (unauthorized) {
    return unauthorized;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return noStoreJson(
      {
        ok: false,
        code: "routine_import_invalid",
        message: "Request body must be valid JSON.",
        category: "invalid_parameter",
        subject: "routine",
        field: "body",
        reason: "invalid_format",
      },
      400,
    );
  }

  const parsed = parseRoutineJsonToDocument(body);

  if (!parsed.ok) {
    return noStoreJson(parsed, 400);
  }

  const normalized = normalizeRoutineImportDocument(parsed.data, todayKey());

  if (!normalized.ok) {
    return noStoreJson(normalized, 400);
  }

  return noStoreJson({
    ok: true,
    routine: normalized.data,
  });
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
