import { handleProjectParseRoute } from "@/features/projects/server/project-import-route";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleProjectParseRoute(request);
}
