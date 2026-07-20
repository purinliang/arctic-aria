import { handleLatencyRoute } from "@/features/performance/server/latency-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  return handleLatencyRoute();
}
