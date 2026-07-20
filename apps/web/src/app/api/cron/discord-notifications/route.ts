import { NextResponse } from "next/server";
import { todayReviewService } from "@/features/dashboard/today-review-service";
import { routineReminderService } from "@/features/routines/server/routine-reminder-service";
import { authorizeCronRequest } from "../cron-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = authorizeCronRequest(request);

  if (unauthorized) {
    return unauthorized;
  }

  const [routineReminders, dailyReviews] = await Promise.all([
    routineReminderService.sendDueRoutineReminders(),
    todayReviewService.sendScheduledDailyReviews(),
  ]);
  const result = {
    dailyReviews,
    routineReminders,
  };

  console.log("[discord-notifications]", "cron_run_finished", result);

  return NextResponse.json(result);
}
