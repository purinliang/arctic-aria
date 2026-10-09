import { NextResponse } from "next/server";
import { todayReviewService } from "@/features/dashboard/today-review-service";
import { routineReminderService } from "@/features/routines/server/routine-reminder-service";
import { authorizeCronRequest } from "../cron-auth";
import { ChatRepository } from '@/features/chat/server/chat-repository';

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const unauthorized = authorizeCronRequest(request);

  if (unauthorized) {
    return unauthorized;
  }

  const [routineReminders, dailyReviews, expiredChats] = await Promise.all([
    routineReminderService.sendDueRoutineReminders(),
    todayReviewService.sendScheduledDailyReviews(),
    new ChatRepository().cleanup(),
  ]);
  const result = {
    dailyReviews,
    routineReminders,
    expiredChats,
  };

  console.log("[discord-notifications]", "cron_run_finished", result);

  return NextResponse.json(result);
}
