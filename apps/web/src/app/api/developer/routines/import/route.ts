import { handleRoutineImportRoute } from "@/features/routines/server/routine-import-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleRoutineImportRoute(request);
}
