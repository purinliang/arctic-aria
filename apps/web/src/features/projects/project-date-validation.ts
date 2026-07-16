export type ProjectDateValidationResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      message: string;
    };

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
}: {
  value: string;
  missingMessage: string;
  invalidMessage: string;
}): ProjectDateValidationResult {
  const date = value.trim();

  if (!date) {
    return { ok: false, message: missingMessage };
  }

  if (!isValidProjectDate(date)) {
    return { ok: false, message: invalidMessage };
  }

  return { ok: true, value: date };
}
