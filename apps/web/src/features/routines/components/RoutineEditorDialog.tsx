// Routines Page - Routine Editor Dialog.
import { LoaderCircle, Save, Trash2, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import {
  MultipleChoiceGroup,
  SingleChoiceGroup,
} from "@/components/forms/choice-group";
import { DatePickerField } from "@/components/forms/date-picker-field";
import {
  DialogActionRow,
  DialogPrimaryButton,
  dialogFrameClass,
} from "@/components/dialog";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { NumberInput } from "@/components/forms/number-field";
import { InlineMessage } from "@/components/text";
import { TextArea } from "@/components/forms/text-area-field";
import { TimePickerField } from "@/components/forms/time-picker-field";
import type { RoutineInput } from "@/features/routines/actions";
import { ruleOptions, weekdayOptions } from "./routine-page-helpers";

export function RoutineEditorDialog({
  darkMode,
  pending,
  message,
  draft,
  setDraft,
  onClose,
  onSubmit,
  onDelete,
}: {
  darkMode: boolean;
  pending: boolean;
  message: string | null;
  draft: RoutineInput;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
  onClose: () => void;
  onSubmit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 px-4 py-6">
      <button
        className="absolute inset-0 cursor-default"
        type="button"
        aria-label="Close routine editor"
        onClick={onClose}
      />
      <form
        className={dialogFrameClass(darkMode)}
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">
            {draft.id ? "Edit routine" : "Add routine"}
          </h3>
          <Button
            darkMode={darkMode}
            tone="ghost"
            size="icon-sm"
            aria-label="Close routine editor"
            icon={<X size={16} aria-hidden="true" />}
            onClick={onClose}
          />
        </div>
        {message ? (
          <InlineMessage darkMode={darkMode} className="mb-3">
            {message}
          </InlineMessage>
        ) : null}
        <div className="grid gap-3">
          <RoutineTextFields
            darkMode={darkMode}
            pending={pending}
            draft={draft}
            setDraft={setDraft}
          />
          <RecurrenceFields
            darkMode={darkMode}
            pending={pending}
            draft={draft}
            setDraft={setDraft}
          />
          <RoutineScheduleFields
            darkMode={darkMode}
            pending={pending}
            draft={draft}
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
            Save
          </DialogPrimaryButton>
          {draft.id ? (
            <Button
              darkMode={darkMode}
              disabled={pending}
              icon={<Trash2 size={14} aria-hidden="true" />}
              onClick={onDelete}
            >
              Delete
            </Button>
          ) : null}
        </DialogActionRow>
      </form>
    </div>
  );
}

function RoutineTextFields({
  darkMode,
  pending,
  draft,
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  return (
    <>
      <FieldLabel darkMode={darkMode} label="Title">
        <TextInput
          darkMode={darkMode}
          value={draft.title}
          maxLength={120}
          placeholder="Routine title"
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({ ...current, title: event.target.value }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label="Description">
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
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  return (
    <>
      <div className="grid gap-2">
        <span className="text-xs font-semibold">Recurrence</span>
        <SingleChoiceGroup
          darkMode={darkMode}
          disabled={pending}
          value={draft.ruleType}
          options={ruleOptions.map((option) => ({
            value: option.type,
            label: option.label,
          }))}
          onChange={(ruleType) =>
            setDraft((current) => ({
              ...current,
              ruleType: ruleType as RoutineInput["ruleType"],
            }))
          }
        />
      </div>
      {draft.ruleType === "weekly" ? (
        <div className="grid gap-2">
          <span className="text-xs font-semibold">Weekdays</span>
          <MultipleChoiceGroup
            darkMode={darkMode}
            disabled={pending}
            values={(draft.weekdays ?? []).map(String)}
            options={weekdayOptions.map((weekday) => ({
              value: String(weekday.value),
              label: weekday.label,
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
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <FieldLabel darkMode={darkMode} label="Interval">
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
        <FieldLabel darkMode={darkMode} label="Day of month">
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
  setDraft,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <FieldLabel darkMode={darkMode} label="First start date">
        <DatePickerField
          darkMode={darkMode}
          placeholder="Select first date"
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
      <FieldLabel darkMode={darkMode} label="End date" optional>
        <DatePickerField
          darkMode={darkMode}
          placeholder="Select end date"
          value={draft.endDate ?? ""}
          disabled={pending}
          onChange={(endDate) =>
            setDraft((current) => ({ ...current, endDate }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label="Preferred time" optional>
        <TimePickerField
          darkMode={darkMode}
          placeholder="Select time"
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
