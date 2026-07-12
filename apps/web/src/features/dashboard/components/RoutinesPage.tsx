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

function panelClass(darkMode: boolean) {
  return darkMode
    ? "border-neutral-800 bg-black text-white"
    : "border-slate-300 bg-white text-slate-950";
}

function mutedText(darkMode: boolean) {
  return darkMode ? "text-neutral-400" : "text-slate-500";
}

function buttonClass(darkMode: boolean, active = false) {
  if (active) {
    return darkMode
      ? "border-white bg-white text-black"
      : "border-slate-950 bg-slate-950 text-white";
  }

  return darkMode
    ? "border-neutral-700 text-neutral-200 hover:border-white"
    : "border-slate-300 text-slate-700 hover:border-slate-500";
}

function inputClass(darkMode: boolean) {
  return `w-full rounded-md border px-3 py-2 text-sm outline-none transition ${
    darkMode
      ? "border-neutral-700 bg-black text-white focus:border-white"
      : "border-slate-300 bg-white text-slate-950 focus:border-slate-600"
  }`;
}

function modalClass(darkMode: boolean) {
  return `relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-md border p-4 shadow-2xl ${
    darkMode
      ? "border-neutral-800 bg-black text-white"
      : "border-slate-200 bg-white text-slate-950"
  }`;
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
      <section className={`rounded-md border ${panelClass(darkMode)}`}>
        <div
          className={`flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${
            darkMode ? "border-neutral-800" : "border-slate-200"
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Bell size={18} aria-hidden="true" />
              <h2 className="text-base font-semibold">Routines</h2>
            </div>
            <p className={`mt-1 text-sm ${mutedText(darkMode)}`}>
              Repeatable checks for the current personal day.
            </p>
          </div>
          <button
            className={`flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
            type="button"
            disabled={pending}
            onClick={openNewEditor}
          >
            <Plus size={15} aria-hidden="true" />
            Add
          </button>
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

        <div
          className={
            darkMode ? "divide-y divide-neutral-900" : "divide-y divide-slate-200"
          }
        >
          {loading ? (
            <p className={`px-4 py-4 text-sm ${mutedText(darkMode)}`}>
              Loading routines...
            </p>
          ) : null}
          {!loading && routines.length === 0 ? (
            <p className={`px-4 py-4 text-sm ${mutedText(darkMode)}`}>
              No routines yet.
            </p>
          ) : null}
          {routines.map((routine) => (
            <article
              key={routine.id}
              className="flex items-start justify-between gap-3 px-4 py-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{routine.title}</h3>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${
                      darkMode
                        ? "border-blue-400/40 bg-blue-500/15 text-blue-200"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                    }`}
                  >
                    {routine.preferredTime ?? "Flexible"}
                  </span>
                </div>
                <p className={`mt-1 text-sm leading-6 ${mutedText(darkMode)}`}>
                  {routine.description || "No description."}
                </p>
                <p className={`mt-2 text-xs ${mutedText(darkMode)}`}>
                  {ruleSummary(routine)}
                </p>
              </div>
              <button
                className={`flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
                type="button"
                disabled={pending}
                onClick={() => openEditor(routine)}
              >
                <Edit3 size={15} aria-hidden="true" />
                Edit
              </button>
            </article>
          ))}
        </div>
      </section>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 px-4 py-6">
          <button
            className="absolute inset-0 cursor-default"
            type="button"
            aria-label="Close routine editor"
            onClick={closeEditor}
          />
          <form
            className={modalClass(darkMode)}
            onSubmit={(event) => {
              event.preventDefault();
              void submitRoutine();
            }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">
                {draft.id ? "Edit routine" : "Add routine"}
              </h3>
              <button
                className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
                  darkMode
                    ? "text-neutral-300 hover:bg-white/10 hover:text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                }`}
                type="button"
                aria-label="Close routine editor"
                onClick={closeEditor}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            {message ? (
              <p
                className={`mb-3 rounded-md border px-3 py-2 text-sm ${
                  darkMode
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {message}
              </p>
            ) : null}
            <div className="grid gap-3">
              <label className="grid gap-1 text-xs font-semibold">
                Title
                <input
                  className={inputClass(darkMode)}
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
              </label>
              <label className="grid gap-1 text-xs font-semibold">
                Description
                <textarea
                  className={`${inputClass(darkMode)} min-h-24 resize-y`}
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
              </label>
              <div className="grid gap-2">
                <span className="text-xs font-semibold">Recurrence</span>
                <div className="flex flex-wrap gap-2">
                  {ruleOptions.map((option) => (
                    <button
                      key={option.type}
                      className={`h-8 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(
                        darkMode,
                        draft.ruleType === option.type,
                      )}`}
                      type="button"
                      disabled={pending}
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          ruleType: option.type,
                        }))
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {draft.ruleType === "weekly" ? (
                <div className="grid gap-2">
                  <span className="text-xs font-semibold">Weekdays</span>
                  <div className="flex flex-wrap gap-2">
                    {weekdayOptions.map((weekday) => (
                      <button
                        key={weekday.value}
                        className={`h-8 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(
                          darkMode,
                          draft.weekdays?.includes(weekday.value) ?? false,
                        )}`}
                        type="button"
                        disabled={pending}
                        onClick={() => toggleWeekday(weekday.value)}
                      >
                        {weekday.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              {draft.ruleType === "monthly_by_date" ||
              draft.ruleType === "day_interval" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs font-semibold">
                    Interval
                    <input
                      className={inputClass(darkMode)}
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
                  </label>
                  {draft.ruleType === "monthly_by_date" ? (
                    <label className="grid gap-1 text-xs font-semibold">
                      Day of month
                      <input
                        className={inputClass(darkMode)}
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
                    </label>
                  ) : null}
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="grid gap-1 text-xs font-semibold">
                  First start date
                  <input
                    className={inputClass(darkMode)}
                    type="date"
                    value={draft.firstStartDate}
                    disabled={pending}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        firstStartDate: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  End date
                  <input
                    className={inputClass(darkMode)}
                    type="date"
                    value={draft.endDate ?? ""}
                    disabled={pending}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold">
                  Preferred time
                  <input
                    className={inputClass(darkMode)}
                    type="time"
                    value={draft.preferredTime ?? ""}
                    disabled={pending}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        preferredTime: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={`flex h-9 items-center gap-2 rounded-md border px-4 text-xs font-semibold transition ${buttonClass(darkMode, true)}`}
                type="submit"
                disabled={pending}
              >
                {pending ? (
                  <LoaderCircle
                    className="animate-spin"
                    size={14}
                    aria-hidden="true"
                  />
                ) : (
                  <Save size={14} aria-hidden="true" />
                )}
                Save
              </button>
              {draft.id ? (
                <button
                  className={`flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-semibold transition ${buttonClass(darkMode)}`}
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    draft.id
                      ? setConfirmationTarget({
                          id: draft.id,
                          title: draft.title || "this routine",
                        })
                      : undefined
                  }
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete
                </button>
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

function ConfirmDialog({
  darkMode,
  pending,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  darkMode: boolean;
  pending: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/65 px-4 py-6">
      <button
        className="absolute inset-0 cursor-default"
        type="button"
        aria-label="Close confirmation"
        onClick={onCancel}
      />
      <section className={`${modalClass(darkMode)} max-w-md`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            className={`flex h-9 w-9 items-center justify-center rounded-md transition ${
              darkMode
                ? "text-neutral-300 hover:bg-white/10 hover:text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            }`}
            type="button"
            aria-label="Close confirmation"
            disabled={pending}
            onClick={onCancel}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <p className={`text-sm leading-6 ${mutedText(darkMode)}`}>
          {description}
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            className={`h-9 rounded-md border px-4 text-xs font-semibold transition ${buttonClass(darkMode)}`}
            type="button"
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`flex h-9 items-center gap-2 rounded-md border px-4 text-xs font-semibold transition ${buttonClass(darkMode, true)}`}
            type="button"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? (
              <LoaderCircle
                className="animate-spin"
                size={14}
                aria-hidden="true"
              />
            ) : (
              <Trash2 size={14} aria-hidden="true" />
            )}
            Delete
          </button>
        </div>
      </section>
    </div>
  );
}
