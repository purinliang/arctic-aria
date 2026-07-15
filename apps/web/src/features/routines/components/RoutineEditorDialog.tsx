import { LoaderCircle, Save, Trash2, X } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/button";
import { dialogFrameClass } from "@/components/dialog";
import { FieldLabel, TextArea, TextInput } from "@/components/input-field";
import { InlineMessage } from "@/components/text";
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
  function toggleWeekday(day: number) {
    setDraft((current) => {
      const weekdays = current.weekdays ?? [];

      return {
        ...current,
        weekdays: weekdays.includes(day)
          ? weekdays.filter((weekday) => weekday !== day)
          : [...weekdays, day].sort(),
      };
    });
  }

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
            onWeekdayToggle={toggleWeekday}
          />
          <RoutineScheduleFields
            darkMode={darkMode}
            pending={pending}
            draft={draft}
            setDraft={setDraft}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            darkMode={darkMode}
            tone="primary"
            type="submit"
            disabled={pending}
            icon={
              pending ? (
                <LoaderCircle
                  className="animate-spin"
                  size={14}
                  aria-hidden="true"
                />
              ) : (
                <Save size={14} aria-hidden="true" />
              )
            }
          >
            Save
          </Button>
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
        </div>
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
  onWeekdayToggle,
}: {
  darkMode: boolean;
  pending: boolean;
  draft: RoutineInput;
  setDraft: Dispatch<SetStateAction<RoutineInput>>;
  onWeekdayToggle: (day: number) => void;
}) {
  return (
    <>
      <div className="grid gap-2">
        <span className="text-xs font-semibold">Recurrence</span>
        <div className="flex flex-wrap gap-2">
          {ruleOptions.map((option) => (
            <Button
              key={option.type}
              darkMode={darkMode}
              size="xs"
              active={draft.ruleType === option.type}
              disabled={pending}
              onClick={() =>
                setDraft((current) => ({ ...current, ruleType: option.type }))
              }
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      {draft.ruleType === "weekly" ? (
        <div className="grid gap-2">
          <span className="text-xs font-semibold">Weekdays</span>
          <div className="flex flex-wrap gap-2">
            {weekdayOptions.map((weekday) => (
              <Button
                key={weekday.value}
                darkMode={darkMode}
                size="xs"
                active={draft.weekdays?.includes(weekday.value) ?? false}
                disabled={pending}
                onClick={() => onWeekdayToggle(weekday.value)}
              >
                {weekday.label}
              </Button>
            ))}
          </div>
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
        <TextInput
          darkMode={darkMode}
          type="number"
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
          <TextInput
            darkMode={darkMode}
            type="number"
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
        <TextInput
          darkMode={darkMode}
          type="text"
          inputMode="numeric"
          placeholder="YYYY-MM-DD"
          value={draft.firstStartDate}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              firstStartDate: event.target.value,
            }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label="End date" optional>
        <TextInput
          darkMode={darkMode}
          type="text"
          inputMode="numeric"
          placeholder="YYYY-MM-DD"
          value={draft.endDate ?? ""}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({ ...current, endDate: event.target.value }))
          }
        />
      </FieldLabel>
      <FieldLabel darkMode={darkMode} label="Preferred time" optional>
        <TextInput
          darkMode={darkMode}
          type="text"
          inputMode="numeric"
          placeholder="HH:MM"
          value={draft.preferredTime ?? ""}
          disabled={pending}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              preferredTime: event.target.value,
            }))
          }
        />
      </FieldLabel>
    </div>
  );
}
