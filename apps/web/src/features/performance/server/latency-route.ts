import { NextResponse } from "next/server";
import { authorizeDeveloperApi } from "@/features/developer/server/developer-api-auth";
import { measureLatencySample } from "./latency-service";

export async function handleLatencyRoute() {
  const unauthorized = await authorizeDeveloperApi();

  if (unauthorized) {
    return unauthorized;
  }

  try {
    return noStoreJson(await measureLatencySample());
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

function noStoreJson(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
