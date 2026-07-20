import { NextResponse } from "next/server";
import { getCurrentUser } from "@/features/auth/actions";

export async function authorizeDeveloperApi() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        code: "developer_unauthorized",
        message: "Sign in before using developer tools.",
      },
      {
        status: 401,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  if (!user.isAdmin) {
    return NextResponse.json(
      {
        ok: false,
        code: "developer_forbidden",
        message: "Developer tools are available only to administrators.",
      },
      {
        status: 403,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return null;
}
