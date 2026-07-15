"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clock, X } from "lucide-react";
import { Button } from "./button";
import {
  formControlClass,
  formControlPopupClass,
} from "./form-control-style";
import { cx } from "./utils";

export function TimePickerField({
  darkMode,
  value,
  onChange,
  placeholder = "Select time",
  hasError = false,
  disabled = false,
  allowClear = true,
  stepMinutes = 15,
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
  const options = useMemo(() => buildTimeOptions(stepMinutes), [stepMinutes]);
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
    <div ref={rootRef} className="relative">
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
        <div className={formControlPopupClass(darkMode, "w-56")}>
          <div className="max-h-64 overflow-y-auto pr-1">
            {options.map((option) => (
              <button
                key={option.value}
                className={cx(
                  "flex h-9 w-full items-center justify-between rounded-md px-3 text-left text-sm transition",
                  option.value === value
                    ? darkMode
                      ? "bg-white text-black"
                      : "bg-slate-950 text-white"
                    : darkMode
                      ? "text-neutral-200 hover:bg-white/10"
                      : "text-slate-700 hover:bg-slate-100",
                )}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
                {option.value === value ? (
                  <Check className="h-3.5 w-3.5" />
                ) : null}
              </button>
            ))}
          </div>

          {allowClear && value ? (
            <Button
              darkMode={darkMode}
              tone="ghost"
              size="xs"
              className="mt-2 w-full"
              icon={<X className="h-3.5 w-3.5" />}
              onClick={() => onChange("")}
            >
              Clear time
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function buildTimeOptions(stepMinutes: number) {
  const normalizedStep = Math.max(5, Math.min(60, stepMinutes));
  const options: Array<{ value: string; label: string }> = [];

  for (let minutes = 0; minutes < 24 * 60; minutes += normalizedStep) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    options.push({ value, label: formatTimeValue(value) });
  }

  return options;
}

function formatTimeValue(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return "";
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) {
    return "";
  }

  const hour12 = hour % 12 || 12;
  const period = hour < 12 ? "AM" : "PM";

  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}
