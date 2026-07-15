"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Clock, X } from "lucide-react";
import { Button } from "../button";
import {
  formControlClass,
  formControlPopupClass,
} from "./form-control-style";
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
  stepMinutes = 5,
  className,
}: {
  darkMode: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  stepMinutes?: number;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedParts = parseTimeValue(value) ?? defaultTimeParts;
  const formattedValue = formatTimeValue(value);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

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
        <div className={formControlPopupClass(darkMode, "w-64")}>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <NumberStepper
              darkMode={darkMode}
              label="Hour"
              value={String(selectedParts.hour12).padStart(2, "0")}
              onIncrement={() =>
                onChange(toTimeValue(stepHour(selectedParts, 1)))
              }
              onDecrement={() =>
                onChange(toTimeValue(stepHour(selectedParts, -1)))
              }
            />
            <NumberStepper
              darkMode={darkMode}
              label="Minute"
              value={String(selectedParts.minute).padStart(2, "0")}
              onIncrement={() =>
                onChange(toTimeValue(stepMinute(selectedParts, stepMinutes)))
              }
              onDecrement={() =>
                onChange(toTimeValue(stepMinute(selectedParts, -stepMinutes)))
              }
            />
            <div className="grid content-end gap-1">
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
                  {period}
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
              Quick minutes
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
              Done
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
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NumberStepper({
  darkMode,
  label,
  value,
  onIncrement,
  onDecrement,
}: {
  darkMode: boolean;
  label: string;
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  return (
    <div className="grid gap-1">
      <div
        className={cx(
          "text-xs font-semibold",
          darkMode ? "text-neutral-400" : "text-slate-500",
        )}
      >
        {label}
      </div>
      <button
        className={stepperButtonClass(darkMode)}
        type="button"
        aria-label={`Increase ${label.toLowerCase()}`}
        onClick={onIncrement}
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <div
        className={cx(
          "grid h-12 place-items-center rounded-md border text-xl font-semibold tabular-nums",
          darkMode
            ? "border-neutral-700 bg-black text-white"
            : "border-slate-200 bg-slate-50 text-slate-950",
        )}
      >
        {value}
      </div>
      <button
        className={stepperButtonClass(darkMode)}
        type="button"
        aria-label={`Decrease ${label.toLowerCase()}`}
        onClick={onDecrement}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

function stepperButtonClass(darkMode: boolean) {
  return cx(
    "grid h-8 place-items-center rounded-md border transition",
    darkMode
      ? "border-neutral-700 text-neutral-200 hover:border-neutral-400"
      : "border-slate-300 text-slate-700 hover:border-slate-500",
  );
}

function formatTimeValue(value: string) {
  const parts = parseTimeValue(value);

  if (!parts) {
    return "";
  }

  return `${parts.hour12}:${String(parts.minute).padStart(2, "0")} ${parts.period}`;
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

function stepHour(parts: TimeParts, offset: number): TimeParts {
  const nextHour = wrap(parts.hour12 + offset, 1, 12);
  return { ...parts, hour12: nextHour };
}

function stepMinute(parts: TimeParts, offset: number): TimeParts {
  const normalizedStep = Math.max(1, Math.min(30, Math.abs(offset)));
  const direction = offset < 0 ? -1 : 1;
  const nextMinute = wrapMinute(parts.minute + normalizedStep * direction);
  return { ...parts, minute: nextMinute };
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

function wrap(value: number, min: number, max: number) {
  if (value > max) {
    return min;
  }

  if (value < min) {
    return max;
  }

  return value;
}

function wrapMinute(value: number) {
  return ((value % 60) + 60) % 60;
}
