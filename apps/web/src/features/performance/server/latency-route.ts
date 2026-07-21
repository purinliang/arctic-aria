import { NextResponse } from "next/server";
import { authorizeDeveloperApi } from "@/features/developer/server/developer-api-auth";
import type { LatencyProbe } from "../latency-types";
import {
  measureBackendLatencySample,
  measureDatabaseLatencySample,
} from "./latency-service";

export async function handleLatencyRoute(request: Request) {
  const probe = await readProbe(request);

  if (!probe) {
    return noStoreJson(
      {
        ok: false,
        code: "performance_latency_invalid_probe",
        message: "Latency probe must be backend or database.",
      },
      400,
    );
  }

  const unauthorized = await authorizeDeveloperApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    if (probe === "backend") {
      return noStoreJson(measureBackendLatencySample());
    }

    return noStoreJson(await measureDatabaseLatencySample());
  } catch (error) {
    console.error("[performance]", "latency_sample_failed", {
      errorName: error instanceof Error ? error.name : "unknown",
    });

    return noStoreJson(
      {
        ok: false,
        code: "performance_latency_failed",
        message: "Latency diagnostics failed.",
      },
      500,
    );
  }
}

async function readProbe(request: Request): Promise<LatencyProbe | null> {
  try {
    const body = (await request.json()) as { probe?: unknown };

    if (body.probe === "backend" || body.probe === "database") {
      return body.probe;
    }
  } catch {
    return null;
  }

  return null;
}

function noStoreJson(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
