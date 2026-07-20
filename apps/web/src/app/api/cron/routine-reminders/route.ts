import { NextResponse } from "next/server";
import { routineReminderService } from "@/features/routines/server/routine-reminder-service";
import { authorizeCronRequest } from "../cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = authorizeCronRequest(request);

  if (unauthorized) {
    return unauthorized;
  }

  const result = await routineReminderService.sendDueRoutineReminders();

  console.log("[routine-reminders]", "cron_run_finished", result);

  return NextResponse.json(result);
}
