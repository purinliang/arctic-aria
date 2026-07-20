import { NextResponse } from "next/server";
import { routineReminderService } from "@/features/routines/server/routine-reminder-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET?.trim();

  if (!expected) {
    return NextResponse.json(
      { error: "Cron secret is not configured." },
      { status: 503 },
    );
  }

  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await routineReminderService.sendDueRoutineReminders();

  console.log("[routine-reminders]", "cron_run_finished", result);

  return NextResponse.json(result);
}
