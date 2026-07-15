"use client";

import { useEffect, useMemo, useState } from "react";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  formControlClass,
  formControlPopupClass,
} from "./form-control-style";
import {
  popoverPlacementClass,
  usePopoverPlacement,
} from "./use-popover-placement";
import { cx } from "../utils";

export type SelectOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

export function SelectInput({
  darkMode,
  hasError = false,
  className,
  disabled = false,
  options,
  placeholder = "Select",
  value,
  name,
  onChange,
  ...props
}: Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "disabled" | "onChange" | "value"
> & {
  darkMode: boolean;
  hasError?: boolean;
  disabled?: boolean;
  name?: string;
  options: readonly SelectOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const { placement, popoverRef, rootRef } = usePopoverPlacement(open);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
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
  }, [open, rootRef]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        className={cx(
          formControlClass(darkMode, hasError),
          "flex items-center justify-between gap-3 text-left font-normal",
          !selectedOption && (darkMode ? "text-neutral-500" : "text-slate-400"),
          className,
        )}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        {...props}
      >
        <span className="min-w-0 truncate">
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {name ? <input type="hidden" name={name} value={value} /> : null}

      {open ? (
        <div
          ref={popoverRef}
          className={formControlPopupClass(
            darkMode,
            cx(
              "grid max-h-64 w-full min-w-48 gap-1 overflow-y-auto p-1",
              popoverPlacementClass(placement),
            ),
          )}
          role="listbox"
        >
          {options.map((option) => {
            const selected = option.value === value;

            return (
              <button
                key={option.value}
                className={cx(
                  "flex w-full items-start justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition disabled:cursor-not-allowed disabled:opacity-40",
                  selected
                    ? darkMode
                      ? "bg-white text-black"
                      : "bg-slate-950 text-white"
                    : darkMode
                      ? "text-neutral-200 hover:bg-white/10"
                      : "text-slate-700 hover:bg-slate-100",
                )}
                type="button"
                role="option"
                aria-selected={selected}
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span className="grid min-w-0 gap-0.5">
                  <span className="truncate font-normal leading-5">
                    {option.label}
                  </span>
                  {option.description ? (
                    <span
                      className={cx(
                        "text-xs leading-5",
                        selected
                          ? "opacity-70"
                          : darkMode
                            ? "text-neutral-400"
                            : "text-slate-500",
                      )}
                    >
                      {option.description}
                    </span>
                  ) : null}
                </span>
                {selected ? <Check className="mt-0.5 h-3.5 w-3.5" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function CheckboxField({
  darkMode,
  label,
  description,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  darkMode: boolean;
  label: ReactNode;
  description?: ReactNode;
}) {
  return (
    <label
      className={cx(
        "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm transition",
        darkMode
          ? "border-neutral-800 hover:border-neutral-600"
          : "border-slate-200 hover:border-slate-300",
        props.checked
          ? darkMode
            ? "bg-white/10"
            : "bg-slate-50"
          : false,
        className,
      )}
    >
      <span
        className={cx(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
          props.checked
            ? darkMode
              ? "border-white bg-white text-black"
              : "border-slate-950 bg-slate-950 text-white"
            : darkMode
              ? "border-neutral-600"
              : "border-slate-300",
        )}
      >
        {props.checked ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
      <span className="grid gap-0.5">
        <span className={darkMode ? "text-white" : "text-slate-950"}>
          {label}
        </span>
        {description ? (
          <span className={darkMode ? "text-neutral-400" : "text-slate-500"}>
            {description}
          </span>
        ) : null}
      </span>
      <input className="sr-only" type="checkbox" {...props} />
    </label>
  );
}

export function CheckboxGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("grid gap-2", className)}>{children}</div>;
}
