"use client";

import { useEffect, useMemo, useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
} from "lucide-react";
import { Button } from "../button";
import { buildCalendarMonthDays, shiftCalendarMonth } from "./date-calendar";
import { formatDateKey } from "./date-format";
import {
  formButtonControlClass,
  formControlPopupPanelClass,
} from "./form-control-style";
import {
  keepPopoverOpenOnBlankClick,
  keepPopoverOpenOnBlankDoubleClick,
  keepPopoverOpenOnBlankMouseDown,
  keepPopoverOpenOnBlankPointerDown,
} from "./popover-interactions";
import {
  popoverHitAreaPlacementClass,
  usePopoverPlacement,
} from "./use-popover-placement";
import { englishFormMessages } from "@/messages/form-messages";
import type { DatePickerMessages } from "@/messages/form-messages";
import { cx } from "../utils";

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
  messages = englishFormMessages.datePicker,
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
  messages?: DatePickerMessages;
}) {
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState<VisibleMonth>(() =>
    monthFromValue(value),
  );
  const { placement, popoverRef, rootRef } = usePopoverPlacement(open);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        !rootRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, popoverRef, rootRef]);

  const days = useMemo(
    () => buildCalendarMonthDays(visibleMonth),
    [visibleMonth],
  );
  const formattedValue = formatDateValue(value, messages);
  const showClear = allowClear && Boolean(value);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        className={cx(
          formButtonControlClass(darkMode, hasError),
          "flex items-center gap-3 text-left",
          showClear && "pr-12",
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
        <Calendar className="h-4 w-4 shrink-0 text-current" />
        <span className="min-w-0 truncate">
          {formattedValue || placeholder}
        </span>
      </button>
      {showClear ? (
        <Button
          darkMode={darkMode}
          tone="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          aria-label={messages.clearDate}
          icon={<X className="h-3.5 w-3.5" />}
          onClick={() => onChange("")}
        />
      ) : null}

      {open ? (
        <div
          ref={popoverRef}
          onClick={keepPopoverOpenOnBlankClick}
          onPointerDown={keepPopoverOpenOnBlankPointerDown}
          onMouseDown={keepPopoverOpenOnBlankMouseDown}
          onDoubleClick={keepPopoverOpenOnBlankDoubleClick}
          className={cx(
            "absolute z-[70]",
            popoverHitAreaPlacementClass(placement),
          )}
        >
          <div
            className={formControlPopupPanelClass(
              darkMode,
              "w-[min(18rem,calc(100vw-2rem))]",
            )}
          >
            <div className="mb-2 grid grid-cols-[auto_auto_minmax(0,1fr)_auto_auto] items-center gap-1">
              <PickerIconButton
                darkMode={darkMode}
                aria-label={messages.previousYear}
                onClick={() =>
                  setVisibleMonth(shiftCalendarMonth(visibleMonth, -12))
                }
              >
                <ChevronsLeft className="h-4 w-4" />
              </PickerIconButton>
              <PickerIconButton
                darkMode={darkMode}
                aria-label={messages.previousMonth}
                onClick={() =>
                  setVisibleMonth(shiftCalendarMonth(visibleMonth, -1))
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </PickerIconButton>
              <div className="truncate px-1 text-center text-sm font-semibold">
                {messages.monthYear(
                  messages.shortMonthNames[visibleMonth.monthIndex],
                  visibleMonth.year,
                )}
              </div>
              <PickerIconButton
                darkMode={darkMode}
                aria-label={messages.nextMonth}
                onClick={() =>
                  setVisibleMonth(shiftCalendarMonth(visibleMonth, 1))
                }
              >
                <ChevronRight className="h-4 w-4" />
              </PickerIconButton>
              <PickerIconButton
                darkMode={darkMode}
                aria-label={messages.nextYear}
                onClick={() =>
                  setVisibleMonth(shiftCalendarMonth(visibleMonth, 12))
                }
              >
                <ChevronsRight className="h-4 w-4" />
              </PickerIconButton>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-normal">
              {messages.weekdayNames.map((weekday) => (
                <div
                  key={weekday}
                  className="text-[var(--aa-secondary-text)]"
                >
                  {weekday}
                </div>
              ))}
            </div>

            <div
              className="mt-1 grid grid-cols-7 gap-1"
              onClick={keepPopoverOpenOnBlankClick}
              onPointerDown={keepPopoverOpenOnBlankPointerDown}
              onMouseDown={keepPopoverOpenOnBlankMouseDown}
              onDoubleClick={keepPopoverOpenOnBlankDoubleClick}
            >
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
                  <div
                    key={`blank-${index}`}
                    className="h-8"
                    onClick={keepPopoverOpenOnBlankClick}
                    onPointerDown={keepPopoverOpenOnBlankPointerDown}
                    onMouseDown={keepPopoverOpenOnBlankMouseDown}
                    onDoubleClick={keepPopoverOpenOnBlankDoubleClick}
                  />
                ),
              )}
            </div>
          </div>
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
    <Button darkMode={darkMode} tone="ghost" size="icon" {...props}>
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
  void darkMode;

  return (
    <button
      className={cx(
        "h-8 rounded-md text-sm transition disabled:cursor-not-allowed",
        selected
          ? "bg-[var(--aa-primary-button-bg)] text-[var(--aa-primary-button-text)] hover:bg-[var(--aa-primary-button-hover-bg)] hover:text-[var(--aa-primary-button-hover-text)] disabled:bg-[var(--aa-primary-button-disabled-bg)] disabled:text-[var(--aa-primary-button-disabled-text)] disabled:hover:bg-[var(--aa-primary-button-disabled-bg)] disabled:hover:text-[var(--aa-primary-button-disabled-text)]"
          : "bg-[var(--aa-secondary-button-bg)] text-[var(--aa-secondary-button-text)] hover:bg-[var(--aa-secondary-button-hover-bg)] hover:text-[var(--aa-secondary-button-hover-text)] disabled:bg-[var(--aa-secondary-button-disabled-bg)] disabled:text-[var(--aa-secondary-button-disabled-text)] disabled:hover:bg-[var(--aa-secondary-button-disabled-bg)] disabled:hover:text-[var(--aa-secondary-button-disabled-text)]",
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

function formatDateValue(value: string, messages: DatePickerMessages) {
  return formatDateKey(value, messages, "");
}

function isDateOutsideBounds(value: string, min?: string, max?: string) {
  return Boolean((min && value < min) || (max && value > max));
}
