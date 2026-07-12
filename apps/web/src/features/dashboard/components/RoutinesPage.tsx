import {
  Bell,
  Edit3,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  dividerClass,
  mutedTextClass,
  sectionBorderClass,
} from "@/components/ui/color";
import { ConfirmDialog, dialogFrameClass } from "@/components/ui/dialog";
import { FieldLabel, TextArea, TextInput } from "@/components/ui/input-field";
import { ListItem } from "@/components/ui/list";
import { Panel } from "@/components/ui/panel";
import { Tag } from "@/components/ui/tag";
import { InlineMessage } from "@/components/ui/text";
import { cx } from "@/components/ui/utils";
import type { RoutineInput } from "@/features/routines/actions";
import type { RoutineDefinition, RoutineRuleType } from "../types";

type RoutineResult = Promise<boolean>;
type ConfirmationTarget = {
  id: string;
  title: string;
};

const ruleOptions: Array<{
  type: RoutineRuleType;
  label: string;
}> = [
  { type: "daily", label: "Daily" },
  { type: "weekly", label: "Weekly" },
  { type: "bi_weekly", label: "Bi-weekly" },
  { type: "monthly_by_date", label: "Monthly date" },
  { type: "day_interval", label: "Day interval" },
];

const weekdayOptions = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function emptyDraft(): RoutineInput {
  return {
    title: "",
    description: "",
    firstStartDate: todayKey(),
    endDate: "",
    ruleType: "daily",
    intervalValue: 1,
    weekdays: [new Date().getDay()],
    dayOfMonth: new Date().getDate(),
    preferredTime: "",
    timezone: "UTC",
  };
}

function toDraft(routine: RoutineDefinition): RoutineInput {
  return {
    id: routine.id,
    title: routine.title,
    description: routine.description,
    firstStartDate: routine.firstStartDate,
    endDate: routine.endDate ?? "",
    ruleType: routine.ruleType,
    intervalValue: routine.intervalValue ?? 1,
    weekdays: routine.weekdays ?? [],
    dayOfMonth: routine.dayOfMonth ?? 1,
    preferredTime: routine.preferredTime ?? "",
    timezone: routine.timezone,
  };
}

function ruleSummary(routine: RoutineDefinition) {
  if (routine.ruleType === "daily") {
    return "Daily";
  }

  if (routine.ruleType === "weekly") {
    const weekdays = routine.weekdays ?? [];

    return `Weekly: ${
      weekdayOptions
        .filter((weekday) => weekdays.includes(weekday.value))
        .map((weekday) => weekday.label)
        .join(", ") || "No day selected"
    }`;
  }

  if (routine.ruleType === "bi_weekly") {
    return "Every 14 days";
  }

  if (routine.ruleType === "monthly_by_date") {
    return `Every ${routine.intervalValue ?? 1} month(s) on day ${
      routine.dayOfMonth ?? 1
    }`;
  }

  return `Every ${routine.intervalValue ?? 1} day(s)`;
}

export function RoutinesPage({
  darkMode,
  routines,
  loading,
  pending,
  message,
  onRoutineSave,
  onRoutineDelete,
  onMessageClear,
}: {
  darkMode: boolean;
  routines: RoutineDefinition[];
  loading: boolean;
  pending: boolean;
  message: string | null;
  onRoutineSave: (input: RoutineInput) => RoutineResult;
  onRoutineDelete: (routineId: string) => RoutineResult;
  onMessageClear: () => void;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<RoutineInput>(emptyDraft);
  const [confirmationTarget, setConfirmationTarget] =
    useState<ConfirmationTarget | null>(null);

  function closeEditor() {
    if (!pending) {
      setEditorOpen(false);
      setDraft(emptyDraft());
      onMessageClear();
    }
  }

  function openNewEditor() {
    setDraft(emptyDraft());
    onMessageClear();
    setEditorOpen(true);
  }

  function openEditor(routine: RoutineDefinition) {
    setDraft(toDraft(routine));
    onMessageClear();
    setEditorOpen(true);
  }

  async function submitRoutine() {
    const saved = await onRoutineSave(draft);

    if (saved) {
      setEditorOpen(false);
      setDraft(emptyDraft());
    }
  }

  async function confirmDelete() {
    if (!confirmationTarget) {
      return;
    }

    const deleted = await onRoutineDelete(confirmationTarget.id);

    if (deleted) {
      setConfirmationTarget(null);
      setEditorOpen(false);
      setDraft(emptyDraft());
    }
  }

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
    <>
      <Panel darkMode={darkMode}>
        <div
          className={cx(
            "flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
            sectionBorderClass(darkMode),
          )}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Bell size={18} aria-hidden="true" />
              <h2 className="text-base font-semibold">Routines</h2>
            </div>
            <p className={`mt-1 text-sm ${mutedTextClass(darkMode)}`}>
              Repeatable checks for the current personal day.
            </p>
          </div>
          <Button
            darkMode={darkMode}
            disabled={pending}
            icon={<Plus size={15} aria-hidden="true" />}
            onClick={openNewEditor}
          >
            Add
          </Button>
        </div>

        {message ? (
          <p
            className={`border-b px-4 py-3 text-sm ${
              darkMode
                ? "border-neutral-900 text-amber-200"
                : "border-slate-200 text-amber-700"
            }`}
          >
            {message}
          </p>
        ) : null}

        <div className={dividerClass(darkMode)}>
          {loading ? (
            <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
              Loading routines...
            </p>
          ) : null}
          {!loading && routines.length === 0 ? (
            <p className={`px-4 py-4 text-sm ${mutedTextClass(darkMode)}`}>
              No routines yet.
            </p>
          ) : null}
          {routines.map((routine) => (
            <ListItem key={routine.id} darkMode={darkMode}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{routine.title}</h3>
                  <Tag darkMode={darkMode}>
                    {routine.preferredTime ?? "Flexible"}
                  </Tag>
                </div>
                <p className={`mt-1 text-sm leading-6 ${mutedTextClass(darkMode)}`}>
                  {routine.description || "No description."}
                </p>
                <p className={`mt-2 text-xs ${mutedTextClass(darkMode)}`}>
                  {ruleSummary(routine)}
                </p>
              </div>
              <Button
                darkMode={darkMode}
                disabled={pending}
                icon={<Edit3 size={15} aria-hidden="true" />}
                onClick={() => openEditor(routine)}
              >
                Edit
              </Button>
            </ListItem>
          ))}
        </div>
      </Panel>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 px-4 py-6">
          <button
            className="absolute inset-0 cursor-default"
            type="button"
            aria-label="Close routine editor"
            onClick={closeEditor}
          />
          <form
            className={dialogFrameClass(darkMode)}
            onSubmit={(event) => {
              event.preventDefault();
              void submitRoutine();
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
                onClick={closeEditor}
              />
            </div>
            {message ? (
              <InlineMessage darkMode={darkMode} className="mb-3">
                {message}
              </InlineMessage>
            ) : null}
            <div className="grid gap-3">
              <FieldLabel darkMode={darkMode} label="Title">
                <TextInput
                  darkMode={darkMode}
                  value={draft.title}
                  maxLength={120}
                  placeholder="Routine title"
                  disabled={pending}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
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
                        setDraft((current) => ({
                          ...current,
                          ruleType: option.type,
                        }))
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
                        onClick={() => toggleWeekday(weekday.value)}
                      >
                        {weekday.label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
              {draft.ruleType === "monthly_by_date" ||
              draft.ruleType === "day_interval" ? (
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
              ) : null}
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
                      setDraft((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
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
                  onClick={() =>
                    draft.id
                      ? setConfirmationTarget({
                          id: draft.id,
                          title: draft.title || "this routine",
                        })
                      : undefined
                  }
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}

      {confirmationTarget ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={pending}
          title="Delete routine"
          description={`Delete "${confirmationTarget.title}"? It will be removed from normal views.`}
          confirmIcon={<Trash2 size={14} aria-hidden="true" />}
          onCancel={() => {
            if (!pending) {
              setConfirmationTarget(null);
            }
          }}
          onConfirm={() => void confirmDelete()}
        />
      ) : null}
    </>
  );
}
