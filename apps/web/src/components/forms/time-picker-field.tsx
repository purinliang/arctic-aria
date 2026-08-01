"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, X } from "lucide-react";
import { Button } from "../button";
import { formatTimeDisplay } from "./time-display";
import {
  formButtonControlClass,
  formControlClass,
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
import { controlGapClass, bodyStackClass } from "../spacing";
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
  const showClear = allowClear && Boolean(value);
  const handlePartsChange = (parts: TimeParts) => {
    setDraftParts(parts);
    onChange(toTimeValue(parts));
  };

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

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        className={cx(
          formButtonControlClass(darkMode, hasError),
          "flex items-center text-left",
          controlGapClass,
          showClear && "pr-12",
          className,
        )}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => {
          if (open) {
            return;
          }

          setDraftParts(savedParts ?? defaultTimePartsFromNow());
          setOpen(true);
        }}
      >
        <Clock className="h-4 w-4 shrink-0 text-current" />
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
          aria-label={messages.clear}
          icon={<X className="h-3.5 w-3.5" />}
          onClick={() => {
            onChange("");
            setDraftParts(null);
          }}
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
              "w-[min(16rem,calc(100vw-2rem))]",
            )}
          >
            <div className={bodyStackClass}>
              <TimeTextInput
                darkMode={darkMode}
                messages={messages}
                parts={selectedParts}
                timeFormatPreference={timeFormatPreference}
                onChange={handlePartsChange}
                onDismiss={() => {
                  setOpen(false);
                  setDraftParts(null);
                }}
              />
              {timeFormatPreference === "12h" ? (
                <div className={cx("grid grid-cols-2", controlGapClass)}>
                  {(["AM", "PM"] as const).map((period) => (
                    <Button
                      key={period}
                      darkMode={darkMode}
                      active={selectedParts.period === period}
                      className="w-full"
                      onClick={() =>
                        handlePartsChange({ ...selectedParts, period })
                      }
                    >
                      {messages.periodLabels[period]}
                    </Button>
                  ))}
                </div>
              ) : null}
            </div>
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
  onDismiss,
}: {
  darkMode: boolean;
  messages: TimePickerMessages;
  parts: TimeParts;
  timeFormatPreference: TimeFormatPreference;
  onChange: (parts: TimeParts) => void;
  onDismiss: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const value = draft ?? formatTimeInputValue(parts, timeFormatPreference);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div className="relative grid min-w-0">
      <input
        ref={inputRef}
        className={formControlClass(
          darkMode,
          false,
          "min-w-0 px-[var(--aa-space-table-cell-x)] text-center text-[length:var(--aa-font-size-xl)] font-[var(--aa-font-weight-semibold)] leading-[var(--aa-line-height-xl)] tabular-nums",
        )}
        type="text"
        inputMode="text"
        value={value}
        aria-label={messages.time}
        placeholder={messages.timePlaceholder}
        onFocus={(event) => event.currentTarget.select()}
        onBlur={() => setDraft(null)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") {
            return;
          }

          event.preventDefault();
          event.stopPropagation();
          onDismiss();
        }}
        onChange={(event) => {
          const nextDraft = event.currentTarget.value;
          const nextParts = parseTypedTimeInput(nextDraft, parts.period);

          setDraft(nextDraft);

          if (nextParts) {
            onChange(nextParts);
          }
        }}
      />
    </div>
  );
}
