"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "../button";
import {
  formControlClass,
  formControlPopupClass,
} from "./form-control-style";
import { cx } from "../utils";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const shortMonthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type VisibleMonth = {
  year: number;
  monthIndex: number;
};

export function DatePickerField({
  darkMode,
  value,
  onChange,
  placeholder = "Select date",
  hasError = false,
  disabled = false,
  allowClear = true,
  min,
  max,
  className,
}: {
  darkMode: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  min?: string;
  max?: string;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<VisibleMonth>(() =>
    monthFromValue(value),
  );

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

  const days = useMemo(() => buildMonthDays(visibleMonth), [visibleMonth]);
  const formattedValue = formatDateValue(value);

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
          if (!open) {
            setVisibleMonth(monthFromValue(value));
          }

          setOpen((current) => !current);
        }}
      >
        <span className="min-w-0 truncate">
          {formattedValue || placeholder}
        </span>
        <Calendar className="h-4 w-4 shrink-0" />
      </button>

      {open ? (
        <div className={formControlPopupClass(darkMode, "w-72")}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <PickerIconButton
              darkMode={darkMode}
              aria-label="Previous month"
              onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </PickerIconButton>
            <div className="text-sm font-semibold">
              {monthNames[visibleMonth.monthIndex]} {visibleMonth.year}
            </div>
            <PickerIconButton
              darkMode={darkMode}
              aria-label="Next month"
              onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </PickerIconButton>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-normal">
            {weekdayNames.map((weekday) => (
              <div
                key={weekday}
                className={darkMode ? "text-neutral-500" : "text-slate-500"}
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((day, index) =>
              day ? (
                <DayButton
                  key={day.value}
                  darkMode={darkMode}
                  day={day.day}
                  selected={day.value === value}
                  disabled={isDateOutsideBounds(day.value, min, max)}
                  onClick={() => {
                    onChange(day.value);
                    setOpen(false);
                  }}
                />
              ) : (
                <div key={`blank-${index}`} className="h-8" />
              ),
            )}
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
              Clear date
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PickerIconButton({
  darkMode,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  darkMode: boolean;
}) {
  return (
    <Button darkMode={darkMode} tone="ghost" size="icon-sm" {...props}>
      {children}
    </Button>
  );
}

function DayButton({
  darkMode,
  day,
  selected,
  disabled,
  onClick,
}: {
  darkMode: boolean;
  day: number;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={cx(
        "h-8 rounded-md text-sm transition disabled:cursor-not-allowed disabled:opacity-30",
        selected
          ? darkMode
            ? "bg-white text-black"
            : "bg-slate-950 text-white"
          : darkMode
            ? "text-neutral-200 hover:bg-white/10"
            : "text-slate-700 hover:bg-slate-100",
      )}
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {day}
    </button>
  );
}

function monthFromValue(value: string): VisibleMonth {
  const parsed = parseDateValue(value);

  if (parsed) {
    return { year: parsed.year, monthIndex: parsed.monthIndex };
  }

  const today = new Date();
  return { year: today.getFullYear(), monthIndex: today.getMonth() };
}

function parseDateValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { year, monthIndex, day };
}

function formatDateValue(value: string) {
  const parsed = parseDateValue(value);

  if (!parsed) {
    return "";
  }

  return `${shortMonthNames[parsed.monthIndex]} ${parsed.day}, ${parsed.year}`;
}

function buildMonthDays(month: VisibleMonth) {
  const firstDay = new Date(month.year, month.monthIndex, 1).getDay();
  const count = new Date(month.year, month.monthIndex + 1, 0).getDate();
  const days: Array<{ day: number; value: string } | null> = [];

  for (let index = 0; index < firstDay; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= count; day += 1) {
    days.push({
      day,
      value: toDateValue(month.year, month.monthIndex, day),
    });
  }

  return days;
}

function addMonths(month: VisibleMonth, offset: number): VisibleMonth {
  const date = new Date(month.year, month.monthIndex + offset, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

function toDateValue(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isDateOutsideBounds(value: string, min?: string, max?: string) {
  return Boolean((min && value < min) || (max && value > max));
}
