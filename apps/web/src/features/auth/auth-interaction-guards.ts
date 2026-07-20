export const immediateLogoutRejectMs = 5_000;
export const frequentOperationRejectMs = 2_000;

export function shouldIgnoreImmediateLogout({
  lastSessionCreatedAt,
  now,
  windowMs = immediateLogoutRejectMs,
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

export function shouldRejectFrequentOperation({
  lastOperationAt,
  now,
  windowMs = frequentOperationRejectMs,
}: {
  lastOperationAt: number | null;
  now: number;
  windowMs?: number;
}) {
  return (
    lastOperationAt !== null &&
    now - lastOperationAt >= 0 &&
    now - lastOperationAt < windowMs
  );
}
