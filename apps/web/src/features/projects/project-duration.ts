export const projectDurationOptions = [
  { value: "1_3_months", label: "1-3 months", days: 90 },
  { value: "3_6_months", label: "3-6 months", days: 180 },
  { value: "6_12_months", label: "6-12 months", days: 365 },
  { value: "1_3_years", label: "1-3 years", days: 1095 },
] as const;

export type ProjectDurationRange = (typeof projectDurationOptions)[number]["value"];
export type ProjectTimelineType = "deadline" | "duration";

export const defaultProjectDurationRange: ProjectDurationRange = "3_6_months";

export function durationDaysForRange(value: string) {
  return (
    projectDurationOptions.find((option) => option.value === value)?.days ??
    null
  );
}

export function coerceProjectDurationRange(value: string | null | undefined) {
  if (!value) {
    return defaultProjectDurationRange;
  }

  const normalized = normalizeDurationText(value);
  const exact = projectDurationOptions.find(
    (option) =>
      normalizeDurationText(option.value) === normalized ||
      normalizeDurationText(option.label) === normalized,
  );

  if (exact) {
    return exact.value;
  }

  const days = durationDaysFromText(value);

  return durationRangeForDays(days);
}

export function durationRangeForDays(days: number | null) {
  if (!days) {
    return defaultProjectDurationRange;
  }

  return (
    projectDurationOptions.find((option) => days <= option.days)?.value ??
    projectDurationOptions[projectDurationOptions.length - 1].value
  );
}

export function durationLabelForDays(days: number | null) {
  const range = durationRangeForDays(days);

  return (
    projectDurationOptions.find((option) => option.value === range)?.label ??
    "3-6 months"
  );
}

function normalizeDurationText(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function durationDaysFromText(value: string) {
  const normalized = value.trim().toLowerCase();
  const rangeMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(?:-|to|_)\s*(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months|year|years|yr|yrs)\b/,
  );

  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    const unit = rangeMatch[3];

    if (Number.isFinite(start) && Number.isFinite(end)) {
      return durationAmountToDays((start + end) / 2, unit);
    }
  }

  const singleMatch = normalized.match(
    /(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months|year|years|yr|yrs)\b/,
  );

  if (!singleMatch) {
    return null;
  }

  const amount = Number(singleMatch[1]);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return durationAmountToDays(amount, singleMatch[2]);
}

function durationAmountToDays(amount: number, unit: string) {
  if (unit.startsWith("day")) {
    return amount;
  }

  if (unit.startsWith("week")) {
    return amount * 7;
  }

  if (unit.startsWith("month")) {
    return amount * 30;
  }

  return amount * 365;
}
