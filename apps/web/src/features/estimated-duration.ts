import type { ActionFailureSubject } from "../messages/action-result.ts";

export const maxEstimatedDurationMinutes = 24 * 60;

export function validateOptionalEstimatedDurationMinutes(
  value: string | null | undefined,
  subject: ActionFailureSubject,
) {
  const trimmed = value?.trim() ?? "";

  if (!trimmed) {
    return {
      ok: true as const,
      value: null,
    };
  }

  if (!/^\d+$/.test(trimmed)) {
    return invalidEstimatedDuration(subject, "invalid_format");
  }

  const minutes = Number(trimmed);

  if (
    !Number.isSafeInteger(minutes) ||
    minutes < 1 ||
    minutes > maxEstimatedDurationMinutes
  ) {
    return invalidEstimatedDuration(subject, "invalid_value");
  }

  return {
    ok: true as const,
    value: minutes,
  };
}

function invalidEstimatedDuration(
  subject: ActionFailureSubject,
  reason: "invalid_format" | "invalid_value",
) {
  return {
    ok: false as const,
    message:
      "Estimated duration must be a positive whole number up to 1440 minutes.",
    code: `${subject}_estimated_duration_invalid`,
    category: "invalid_parameter" as const,
    subject,
    field: "estimated_duration",
    reason,
    limit: maxEstimatedDurationMinutes,
  };
}
