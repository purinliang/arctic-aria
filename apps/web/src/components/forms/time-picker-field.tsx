"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "../button";
import {
  formControlClass,
  formControlPopupClass,
} from "./form-control-style";
import {
  popoverPlacementClass,
  usePopoverPlacement,
} from "./use-popover-placement";
import {
  dayPeriodForTime,
  defaultTimePartsFromNow,
  formatTimeInputValue,
  parseTimeValue,
  parseTypedTimeInput,
  toTimeValue,
} from "./time-picker-utils";
import { englishFormMessages } from "@/messages/form-messages";
import type { TimePickerMessages } from "@/messages/form-messages";
import type { TimeParts } from "./time-picker-utils";
import { cx } from "../utils";

export function TimePickerField({
  darkMode,
  value,
  onChange,
  placeholder = "Select time",
  hasError = false,
  disabled = false,
  allowClear = true,
  className,
  messages = englishFormMessages.timePicker,
}: {
  darkMode: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
  messages?: TimePickerMessages;
}) {
  const [open, setOpen] = useState(false);
  const [draftParts, setDraftParts] = useState<TimeParts | null>(null);
  const { placement, popoverRef, rootRef } = usePopoverPlacement(open);
  const savedParts = parseTimeValue(value);
  const selectedParts = draftParts ?? savedParts ?? defaultTimePartsFromNow();
  const formattedValue = formatTimeValue(value, messages);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (!rootRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, rootRef]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        className={cx(
          formControlClass(darkMode, hasError),
          "flex items-center justify-between gap-3 text-left",
          !formattedValue && (darkMode ? "text-neutral-500" : "text-slate-400"),
          className,
        )}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => {
          setDraftParts(savedParts ?? defaultTimePartsFromNow());
          setOpen((current) => !current);
        }}
      >
        <span className="min-w-0 truncate">
          {formattedValue || placeholder}
        </span>
        <Clock className="h-4 w-4 shrink-0" />
      </button>

      {open ? (
        <div
          ref={popoverRef}
          className={formControlPopupClass(
            darkMode,
            cx(
              "w-[min(16rem,calc(100vw-2rem))]",
              popoverPlacementClass(placement),
            ),
          )}
        >
          <div className="grid gap-3">
            <TimeTextInput
              darkMode={darkMode}
              messages={messages}
              parts={selectedParts}
              onChange={setDraftParts}
            />
            <div className="grid grid-cols-2 gap-2">
              {(["AM", "PM"] as const).map((period) => (
                <button
                  key={period}
                  className={cx(
                    "h-9 rounded-md border px-3 text-xs font-semibold transition",
                    selectedParts.period === period
                      ? darkMode
                        ? "border-white bg-white text-black"
                        : "border-slate-950 bg-slate-950 text-white"
                      : darkMode
                        ? "border-neutral-700 text-neutral-200 hover:border-neutral-400"
                        : "border-slate-300 text-slate-700 hover:border-slate-500",
                  )}
                  type="button"
                  onClick={() => setDraftParts({ ...selectedParts, period })}
                >
                  {messages.periodLabels[period]}
                </button>
              ))}
            </div>
            <p
              className={cx(
                "text-xs leading-5",
                darkMode ? "text-neutral-400" : "text-slate-500",
              )}
            >
              {messages.preview(
                formatTimeValue(toTimeValue(selectedParts), messages),
                messages.dayPeriods[dayPeriodForTime(selectedParts)],
              )}
            </p>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              darkMode={darkMode}
              tone="primary"
              size="xs"
              className="flex-1"
              onClick={() => {
                onChange(toTimeValue(selectedParts));
                setOpen(false);
                setDraftParts(null);
              }}
            >
              {messages.confirm}
            </Button>
            {allowClear && value ? (
              <Button
                darkMode={darkMode}
                tone="ghost"
                size="xs"
                className="flex-1"
                icon={<X className="h-3.5 w-3.5" />}
                onClick={() => {
                  onChange("");
                  setOpen(false);
                  setDraftParts(null);
                }}
              >
                {messages.clear}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TimeTextInput({
  darkMode,
  messages,
  parts,
  onChange,
}: {
  darkMode: boolean;
  messages: TimePickerMessages;
  parts: TimeParts;
  onChange: (parts: TimeParts) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? formatTimeInputValue(parts);

  return (
    <label className="grid min-w-0">
      <span className="sr-only">{messages.time}</span>
      <input
        className={cx(
          "h-12 w-full min-w-0 rounded-md border px-2 text-center text-xl font-semibold tabular-nums outline-none transition",
          darkMode
            ? "border-neutral-700 bg-black text-white focus:border-neutral-300"
            : "border-slate-200 bg-slate-50 text-slate-950 focus:border-slate-500",
        )}
        type="text"
        inputMode="text"
        value={value}
        placeholder={messages.timePlaceholder}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={() => setDraft(null)}
        onChange={(event) => {
          const nextDraft = event.currentTarget.value;
          const nextParts = parseTypedTimeInput(nextDraft, parts.period);

          setDraft(nextDraft);

          if (nextParts) {
            onChange(nextParts);
          }
        }}
      />
    </label>
  );
}

function formatTimeValue(value: string, messages: TimePickerMessages) {
  const parts = parseTimeValue(value);

  if (!parts) {
    return "";
  }

  return messages.value(
    parts.hour12,
    parts.minute,
    messages.periodLabels[parts.period],
  );
}
