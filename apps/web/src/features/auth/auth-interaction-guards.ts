export const immediateLogoutIgnoreMs = 3_000;

export function shouldIgnoreImmediateLogout({
  lastSessionCreatedAt,
  now,
  windowMs = immediateLogoutIgnoreMs,
}: {
  lastSessionCreatedAt: number | null;
  now: number;
  windowMs?: number;
}) {
  return (
    lastSessionCreatedAt !== null &&
    now - lastSessionCreatedAt >= 0 &&
    now - lastSessionCreatedAt < windowMs
  );
}
