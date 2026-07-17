"use client";

import { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "../button";
import { formatTimeDisplay } from "./time-display";
import {
  formControlClass,
  formControlPopupClass,
} from "./form-control-style";
import {
  popoverPlacementClass,
  usePopoverPlacement,
} from "./use-popover-placement";
import {
  defaultTimePartsFromNow,
  formatTimeInputValue,
  parseTimeValue,
  parseTypedTimeInput,
  toTimeValue,
} from "./time-picker-utils";
import { englishFormMessages } from "@/messages/form-messages";
import type { TimeFormatPreference } from "@/features/settings/preferences";
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
  timeFormatPreference = "12h",
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
  timeFormatPreference?: TimeFormatPreference;
}) {
  const [open, setOpen] = useState(false);
  const [draftParts, setDraftParts] = useState<TimeParts | null>(null);
  const { placement, popoverRef, rootRef } = usePopoverPlacement(open);
  const savedParts = parseTimeValue(value);
  const selectedParts = draftParts ?? savedParts ?? defaultTimePartsFromNow();
  const formattedValue = formatTimeDisplay(
    value,
    messages,
    timeFormatPreference,
  );

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
          !formattedValue && "text-[var(--aa-color-muted)]",
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
              timeFormatPreference={timeFormatPreference}
              onChange={setDraftParts}
            />
            {timeFormatPreference === "12h" ? (
              <div className="grid grid-cols-2 gap-2">
                {(["AM", "PM"] as const).map((period) => (
                  <button
                    key={period}
                    className={cx(
                      "h-9 rounded-md border px-3 text-xs font-semibold transition",
                      selectedParts.period === period
                        ? "border-[var(--aa-color-selected-border)] bg-[var(--aa-color-selected)] text-[var(--aa-color-selected-text)] hover:bg-[var(--aa-color-selected-hover)] hover:text-[var(--aa-color-selected-hover-text)]"
                        : "border-[var(--aa-color-border)] text-[var(--aa-color-muted)] hover:border-[var(--aa-color-border-strong)] hover:bg-[var(--aa-color-control-hover)] hover:text-[var(--aa-color-text)]",
                    )}
                    type="button"
                    onClick={() => setDraftParts({ ...selectedParts, period })}
                  >
                    {messages.periodLabels[period]}
                  </button>
                ))}
              </div>
            ) : null}
            <p
              className={cx(
                "text-xs leading-5",
                "text-[var(--aa-color-muted)]",
              )}
            >
              {formatTimeDisplay(
                toTimeValue(selectedParts),
                messages,
                timeFormatPreference,
              )}
            </p>
          </div>

          <div className="mt-3 grid gap-2">
            <Button
              darkMode={darkMode}
              tone="primary"
              size="xs"
              className="w-full"
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
                className="w-full"
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
  timeFormatPreference,
  onChange,
}: {
  darkMode: boolean;
  messages: TimePickerMessages;
  parts: TimeParts;
  timeFormatPreference: TimeFormatPreference;
  onChange: (parts: TimeParts) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? formatTimeInputValue(parts, timeFormatPreference);

  return (
    <label className="grid min-w-0">
      <span className="sr-only">{messages.time}</span>
      <input
        className={cx(
          "h-12 w-full min-w-0 rounded-md border px-2 text-center text-xl font-semibold tabular-nums outline-none transition",
          "border-[var(--aa-color-border)] bg-[var(--aa-color-control)] text-[var(--aa-color-text)] focus:border-[var(--aa-color-border-strong)]",
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
