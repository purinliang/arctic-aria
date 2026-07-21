import type { ActionFailureResult } from "../../messages/action-result.ts";

export type ProjectDateValidationResult =
  | {
      ok: true;
      value: string;
    }
  | ActionFailureResult;

export function isValidProjectDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function validateRequiredProjectDate({
  value,
  missingMessage,
  invalidMessage,
  missingCode,
  invalidCode,
  field,
}: {
  value: string;
  missingMessage: string;
  invalidMessage: string;
  missingCode: string;
  invalidCode: string;
  field: string;
}): ProjectDateValidationResult {
  const date = value.trim();

  if (!date) {
    return {
      ok: false,
      message: missingMessage,
      code: missingCode,
      category: "missing_parameter",
      field,
      reason: "required",
    };
  }

  if (!isValidProjectDate(date)) {
    return {
      ok: false,
      message: invalidMessage,
      code: invalidCode,
      category: "invalid_parameter",
      field,
      reason: "invalid_format",
    };
  }

  return { ok: true, value: date };
}
