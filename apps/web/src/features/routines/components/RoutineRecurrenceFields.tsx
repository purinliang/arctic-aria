// Routines Page - Routine Recurrence Fields.
import type { Dispatch, SetStateAction } from "react";
import { formatDateKey } from "@/components/forms/date-format";
import { FieldLabel } from "@/components/forms/input-field";
import { NumberInput } from "@/components/forms/number-field";
import { SelectInput } from "@/components/forms/selection-field";
import { SupportingText } from "@/components/text";
import type { RoutineInput } from "@/features/routines/actions";
import {
  applyRecurrenceOption,
  fixedDayIntervalInputValue,
  fixedDayIntervalValueFromInput,
  normalizeRoutineRecurrenceDraft,
  previewRoutineDateKeys,
  recurrenceOptionFromRule,
  routineRecurrenceOptions,
} from "@/features/routines/routine-recurrence";
import type { RoutineRecurrenceOption } from "@/features/routines/routine-recurrence";
import type { FormMessages, RoutineMessages } from "@/messages/app-messages";

export function RoutineRecurrenceFields({
  darkMode,
  pending,
  draft,
  messages,
  formMessages,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  messages: RoutineMessages;
  formMessages: FormMessages;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  const selectedOption = recurrenceOptionFromRule(draft);

  return (
    <div className="grid gap-3">
      <FieldLabel darkMode={darkMode} label={messages.editor.recurrence}>
        <SelectInput
          darkMode={darkMode}
          disabled={pending}
          value={selectedOption}
          options={routineRecurrenceOptions.map((option) => ({
            value: option,
            label: messages.recurrenceOptions[option],
            description: messages.recurrenceDescriptions[option],
          }))}
          onChange={(value) =>
            setDraft((current) =>
              normalizeRoutineRecurrenceDraft(
                applyRecurrenceOption(current, value as RoutineRecurrenceOption),
              ),
            )
          }
        />
      </FieldLabel>
      {selectedOption === "fixed_days" ? (
        <FieldLabel darkMode={darkMode} label={messages.editor.fixedIntervalDays}>
          <NumberInput
            darkMode={darkMode}
            min={1}
            value={fixedDayIntervalInputValue(draft.intervalValue)}
            disabled={pending}
            onChange={(event) =>
              setDraft((current) =>
                normalizeRoutineRecurrenceDraft({
                  ...current,
                  intervalValue: fixedDayIntervalValueFromInput(
                    event.target.value,
                  ),
                }),
              )
            }
          />
        </FieldLabel>
      ) : null}
      <RoutineRecurrencePreview
        darkMode={darkMode}
        draft={draft}
        messages={messages}
        dateMessages={formMessages.datePicker}
      />
    </div>
  );
}

function RoutineRecurrencePreview({
  darkMode,
  draft,
  messages,
  dateMessages,
}: {
  darkMode: boolean;
  draft: RoutineInput;
  messages: RoutineMessages;
  dateMessages: FormMessages["datePicker"];
}) {
  const preview = previewRoutineDateKeys(draft);
  const dates = preview.dates.map((date) =>
    formatPreviewDate(date, dateMessages),
  );

  return (
    <SupportingText darkMode={darkMode} className="block">
      {dates.length > 0
        ? `${messages.editor.preview}: ${dates.join(" · ")}${
            preview.continues ? ` · ${messages.editor.andSoOn}` : ""
          }`
        : messages.editor.previewUnavailable}
    </SupportingText>
  );
}

function formatPreviewDate(
  dateKey: string,
  messages: FormMessages["datePicker"],
) {
  return formatDateKey(dateKey, messages, dateKey);
}
