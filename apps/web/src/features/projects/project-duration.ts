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
