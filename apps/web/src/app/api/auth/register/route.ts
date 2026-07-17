import { handleAuthRoute } from "@/features/auth/server/auth-route";

export async function POST(request: Request) {
  return handleAuthRoute(request, "register");
}
