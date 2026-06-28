import { AuthGate } from "@/features/auth/components/AuthGate";

export default function Home() {
  return <AuthGate />;
}
