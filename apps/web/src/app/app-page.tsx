import { AuthGate } from "@/features/auth/components/AuthGate";

export function AppPage() {
  return (
    <AuthGate
      showTodayReviewSendAction={process.env.VERCEL_ENV !== "production"}
    />
  );
}
