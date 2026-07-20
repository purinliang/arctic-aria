"use server";

import { getCurrentUser } from "@/features/auth/actions";
import {
  todayReviewService,
  type TodayReviewActionResult,
} from "./today-review-service";

export async function sendTodayReviewDiscordMessage(): Promise<
  TodayReviewActionResult
> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      ok: false,
      code: "auth_required",
      message: "Please sign in again.",
    };
  }

  return todayReviewService.sendTodayReview(user.id);
}
