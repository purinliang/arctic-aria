// Routines Page - Routine Editor Dialog.
import { LoaderCircle, Save, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import { MultipleChoiceGroup } from "@/components/forms/choice-group";
import { DatePickerField } from "@/components/forms/date-picker-field";
import {
  DialogActionRow,
  DialogBackdrop,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "@/components/dialog";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { NumberInput } from "@/components/forms/number-field";
import { SelectInput } from "@/components/forms/selection-field";
import { TextArea } from "@/components/forms/text-area-field";
import { TimePickerField } from "@/components/forms/time-picker-field";
import type { RoutineInput } from "@/features/routines/actions";
import type { FormMessages, RoutineMessages } from "@/messages/app-messages";
import { ruleOptions, weekdayOptions } from "./routine-page-helpers";

export function RoutineEditorDialog({
  darkMode,
  pending,
  draft,
  messages,
  formMessages,
  setDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  messages: RoutineMessages;
  formMessages: FormMessages;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete: () => void;
}) {
  return (
    <DialogOverlay>
      <DialogBackdrop label={messages.editor.close} onClick={onClose} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogFrame darkMode={darkMode}>
          <DialogHeader
            darkMode={darkMode}
            title={draft.id ? messages.editor.edit : messages.editor.add}
            closeLabel={messages.editor.close}
            onClose={onClose}
          />
          <div className="grid gap-3">
            <RoutineTextFields
              darkMode={darkMode}
              pending={pending}
              draft={draft}
              messages={messages.editor}
              setDraft={setDraft}
            />
            <RecurrenceFields
              darkMode={darkMode}
              pending={pending}
              draft={draft}
              messages={messages}
              setDraft={setDraft}
            />
            <RoutineScheduleFields
              darkMode={darkMode}
              pending={pending}
              draft={draft}
              messages={messages.editor}
              formMessages={formMessages}
              setDraft={setDraft}
            />
          </div>
          <DialogActionRow>
            <DialogPrimaryButton
              darkMode={darkMode}
              type="submit"
              loading={pending}
              icon={<Save size={14} aria-hidden="true" />}
              loadingIcon={
                <LoaderCircle
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              }
            >
              {messages.editor.save}
            </DialogPrimaryButton>
            {draft.id ? (
              <Button
                darkMode={darkMode}
                disabled={pending}
                icon={<Trash2 size={14} aria-hidden="true" />}
                onClick={onDelete}
              >
                {messages.editor.delete}
              </Button>
            ) : null}
          </DialogActionRow>
        </DialogFrame>
      </form>
    </DialogOverlay>
  );
}

function RoutineTextFields({
  darkMode,
  pending,
  draft,
  messages,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  messages: RoutineMessages["editor"];
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  return (
    <>
      <FieldLabel darkMode={darkMode} label={messages.title}>
        <TextInput
          darkMode={darkMode}
          value={draft.title}
          maxLength={120}
          placeholder={messages.titlePlaceholder}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({ ...current, title: event.target.value }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.description}>
        <TextArea
          darkMode={darkMode}
          className="min-h-24"
          value={draft.description}
          maxLength={2000}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </FieldLabel>
    </>
  );
}

function RecurrenceFields({
  darkMode,
  pending,
  draft,
  messages,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  messages: RoutineMessages;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  return (
    <>
      <div className="grid gap-2">
        <FieldLabel darkMode={darkMode} label={messages.editor.recurrence}>
          <SelectInput
            darkMode={darkMode}
            disabled={pending}
            value={draft.ruleType}
            options={ruleOptions.map((option) => ({
              value: option.type,
              label: messages.rules[option.type],
              description: messages.ruleDescriptions[option.type],
            }))}
            onChange={(ruleType) =>
              setDraft((current) => ({
                ...current,
                ruleType: ruleType as RoutineInput["ruleType"],
              }))
            }
          />
        </FieldLabel>
      </div>
      {draft.ruleType === "weekly" ? (
        <div className="grid gap-2">
          <span className="text-xs font-semibold">{messages.editor.weekdays}</span>
          <MultipleChoiceGroup
            darkMode={darkMode}
            disabled={pending}
            values={(draft.weekdays ?? []).map(String)}
            options={weekdayOptions.map((weekday) => ({
              value: String(weekday.value),
              label: messages.weekdays[weekday.value],
            }))}
            onChange={(values) =>
              setDraft((current) => ({
                ...current,
                weekdays: values.map(Number).sort((left, right) => left - right),
              }))
            }
          />
        </div>
      ) : null}
      {draft.ruleType === "monthly_by_date" ||
      draft.ruleType === "day_interval" ? (
        <IntervalFields
          darkMode={darkMode}
          pending={pending}
          draft={draft}
          messages={messages.editor}
          setDraft={setDraft}
        />
      ) : null}
    </>
  );
}

function IntervalFields({
  darkMode,
  pending,
  draft,
  messages,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  messages: RoutineMessages["editor"];
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FieldLabel darkMode={darkMode} label={messages.interval}>
        <NumberInput
          darkMode={darkMode}
          min={1}
          value={draft.intervalValue ?? 1}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              intervalValue: Number(event.target.value),
            }))
          }
        />
      </FieldLabel>
      {draft.ruleType === "monthly_by_date" ? (
        <FieldLabel darkMode={darkMode} label={messages.dayOfMonth}>
          <NumberInput
            darkMode={darkMode}
            min={1}
            max={31}
            value={draft.dayOfMonth ?? 1}
            disabled={pending}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                dayOfMonth: Number(event.target.value),
              }))
            }
          />
        </FieldLabel>
      ) : null}
    </div>
  );
}

function RoutineScheduleFields({
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
  messages: RoutineMessages["editor"];
  formMessages: FormMessages;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <FieldLabel darkMode={darkMode} label={messages.firstStartDate}>
        <DatePickerField
          darkMode={darkMode}
          placeholder={messages.selectFirstDate}
          messages={formMessages.datePicker}
          value={draft.firstStartDate}
          disabled={pending}
          onChange={(firstStartDate) =>
            setDraft((current) => ({
              ...current,
              firstStartDate,
            }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.endDate} optional>
        <DatePickerField
          darkMode={darkMode}
          placeholder={messages.selectEndDate}
          messages={formMessages.datePicker}
          value={draft.endDate ?? ""}
          disabled={pending}
          onChange={(endDate) =>
            setDraft((current) => ({ ...current, endDate }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label={messages.preferredTime} optional>
        <TimePickerField
          darkMode={darkMode}
          placeholder={messages.selectTime}
          messages={formMessages.timePicker}
          value={draft.preferredTime ?? ""}
          disabled={pending}
          onChange={(preferredTime) =>
            setDraft((current) => ({
              ...current,
              preferredTime,
            }))
          }
        />
      </FieldLabel>
    </div>
  );
}
