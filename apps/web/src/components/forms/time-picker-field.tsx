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
import { englishFormMessages } from "@/messages/form-messages";
import type { TimePickerMessages } from "@/messages/form-messages";
import { cx } from "../utils";

type Period = "AM" | "PM";

type TimeParts = {
  hour12: number;
  minute: number;
  period: Period;
};

const defaultTimeParts: TimeParts = {
  hour12: 9,
  minute: 0,
  period: "AM",
};

const quickMinuteOptions = [0, 15, 30, 45];

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
  const { placement, popoverRef, rootRef } = usePopoverPlacement(open);
  const selectedParts = parseTimeValue(value) ?? defaultTimeParts;
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
        onClick={() => setOpen((current) => !current)}
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
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <TimeNumberInput
                darkMode={darkMode}
                label={messages.hour}
                value={selectedParts.hour12}
                min={1}
                max={12}
                onChange={(hour12) =>
                  onChange(toTimeValue({ ...selectedParts, hour12 }))
                }
              />
              <span
                className={cx(
                  "pb-2 text-center text-2xl font-semibold",
                  darkMode ? "text-neutral-500" : "text-slate-400",
                )}
              >
                :
              </span>
              <TimeNumberInput
                darkMode={darkMode}
                label={messages.minute}
                value={selectedParts.minute}
                min={0}
                max={59}
                onChange={(minute) =>
                  onChange(toTimeValue({ ...selectedParts, minute }))
                }
              />
            </div>
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
                  onClick={() =>
                    onChange(toTimeValue({ ...selectedParts, period }))
                  }
                >
                  {messages.periodLabels[period]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 grid gap-1">
            <div
              className={cx(
                "text-xs font-semibold",
                darkMode ? "text-neutral-400" : "text-slate-500",
              )}
            >
              {messages.quickMinutes}
            </div>
            <div className="grid grid-cols-4 gap-1">
              {quickMinuteOptions.map((minute) => (
                <button
                  key={minute}
                  className={cx(
                    "h-8 rounded-md border text-xs font-semibold transition",
                    selectedParts.minute === minute
                      ? darkMode
                        ? "border-white bg-white text-black"
                        : "border-slate-950 bg-slate-950 text-white"
                      : darkMode
                        ? "border-neutral-700 text-neutral-200 hover:border-neutral-400"
                        : "border-slate-300 text-slate-700 hover:border-slate-500",
                  )}
                  type="button"
                  onClick={() =>
                    onChange(toTimeValue({ ...selectedParts, minute }))
                  }
                >
                  {String(minute).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              darkMode={darkMode}
              tone="primary"
              size="xs"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              {messages.done}
            </Button>
            {allowClear && value ? (
              <Button
                darkMode={darkMode}
                tone="ghost"
                size="xs"
                className="flex-1"
                icon={<X className="h-3.5 w-3.5" />}
                onClick={() => onChange("")}
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

function TimeNumberInput({
  darkMode,
  label,
  value,
  min,
  max,
  onChange,
}: {
  darkMode: boolean;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="grid gap-1">
      <span
        className={cx(
          "text-xs font-semibold",
          darkMode ? "text-neutral-400" : "text-slate-500",
        )}
      >
        {label}
      </span>
      <input
        className={cx(
          "h-12 rounded-md border px-3 text-center text-xl font-semibold tabular-nums outline-none transition",
          darkMode
            ? "border-neutral-700 bg-black text-white focus:border-neutral-300"
            : "border-slate-200 bg-slate-50 text-slate-950 focus:border-slate-500",
        )}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={2}
        value={String(value).padStart(2, "0")}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          const digits = event.currentTarget.value.replace(/\D/g, "").slice(-2);

          if (!digits) {
            return;
          }

          onChange(clamp(Number(digits), min, max));
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

function parseTimeValue(value: string): TimeParts | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    return null;
  }

  const hour12 = hour % 12 || 12;
  const period = hour < 12 ? "AM" : "PM";

  return { hour12, minute, period };
}

function toTimeValue(parts: TimeParts) {
  const hour24 =
    parts.period === "AM"
      ? parts.hour12 % 12
      : parts.hour12 === 12
        ? 12
        : parts.hour12 + 12;

  return `${String(hour24).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
