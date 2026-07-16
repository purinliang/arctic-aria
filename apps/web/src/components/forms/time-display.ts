import type { TimeFormatPreference } from "../../features/settings/preferences.ts";
import type { TimePickerMessages } from "../../messages/form-messages.ts";
import {
  dayPeriodForTime,
  hour24FromParts,
  parseTimeValue,
} from "./time-picker-utils.ts";

export function formatTimeDisplay(
  value: string,
  messages: TimePickerMessages,
  preference: TimeFormatPreference,
) {
  const parts = parseTimeValue(value);

  if (!parts) {
    return "";
  }

  const time =
    preference === "24h"
      ? `${String(hour24FromParts(parts)).padStart(2, "0")}:${String(
          parts.minute,
        ).padStart(2, "0")}`
      : messages.value(
          parts.hour12,
          parts.minute,
          messages.periodLabels[parts.period],
        );
  const dayPeriod = capitalizeLabel(messages.dayPeriods[dayPeriodForTime(parts)]);

  return messages.preview(time, dayPeriod);
}

function capitalizeLabel(label: string) {
  return label ? `${label[0]?.toLocaleUpperCase()}${label.slice(1)}` : label;
}
