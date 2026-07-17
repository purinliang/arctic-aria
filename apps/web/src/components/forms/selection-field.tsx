"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import {
  formControlClass,
  formControlPopupClass,
} from "./form-control-style";
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
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedOption = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );
  const updatePopoverStyle = useCallback(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

    const viewportPadding = 16;
    const anchorGap = 8;
    const maxMenuHeight = 256;
    const popoverHeight = popoverRef.current
      ? Math.min(popoverRef.current.scrollHeight, maxMenuHeight)
      : maxMenuHeight;
    const rootRect = root.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const availableWidth = Math.max(160, viewportWidth - viewportPadding * 2);
    const menuWidth = Math.min(rootRect.width, availableWidth);
    const minMenuWidth = Math.min(Math.max(menuWidth, 192), availableWidth);
    const spaceAbove = rootRect.top - viewportPadding;
    const spaceBelow = window.innerHeight - rootRect.bottom - viewportPadding;
    const opensAbove =
      spaceBelow < popoverHeight + anchorGap && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      96,
      Math.min(maxMenuHeight, (opensAbove ? spaceAbove : spaceBelow) - anchorGap),
    );
    const maxLeft = Math.max(
      viewportPadding,
      viewportWidth - viewportPadding - minMenuWidth,
    );
    const left = Math.min(
      Math.max(viewportPadding, rootRect.left),
      maxLeft,
    );

    setPopoverStyle({
      left,
      maxHeight: availableHeight,
      minWidth: minMenuWidth,
      position: "fixed",
      width: menuWidth,
      ...(opensAbove
        ? { bottom: window.innerHeight - rootRect.top + anchorGap }
        : { top: rootRect.bottom + anchorGap }),
    });
  }, []);

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
  }, [open, rootRef]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePopoverStyle();
    window.addEventListener("resize", updatePopoverStyle);
    window.addEventListener("scroll", updatePopoverStyle, true);

    return () => {
      window.removeEventListener("resize", updatePopoverStyle);
      window.removeEventListener("scroll", updatePopoverStyle, true);
    };
  }, [open, updatePopoverStyle]);

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        className={cx(
          formControlClass(darkMode, hasError),
          "flex items-center justify-between gap-3 text-left font-normal",
          !selectedOption && "text-[var(--aa-color-muted)]",
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

      {open
        ? createPortal(
            <div
              ref={popoverRef}
              style={popoverStyle ?? undefined}
              className={formControlPopupClass(
                darkMode,
                "grid min-w-48 overflow-hidden overflow-y-auto p-1",
              )}
              role="listbox"
            >
              {options.map((option) => {
                const selected = option.value === value;

                return (
                  <button
                    key={option.value}
                    className={cx(
                      "flex w-full items-start justify-between gap-3 px-2 py-2 text-left text-sm transition first:rounded-t-sm last:rounded-b-sm disabled:cursor-not-allowed disabled:opacity-40",
                      selected
                        ? "bg-[var(--aa-color-selected)] text-[var(--aa-color-selected-text)] hover:bg-[var(--aa-color-selected-hover)] hover:text-[var(--aa-color-selected-hover-text)]"
                        : "text-[var(--aa-color-text)] hover:bg-[var(--aa-color-control-hover)]",
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
                              : "text-[var(--aa-color-muted)]",
                          )}
                        >
                          {option.description}
                        </span>
                      ) : null}
                    </span>
                    {selected ? (
                      <Check className="mt-0.5 h-3.5 w-3.5" />
                    ) : null}
                  </button>
                );
              })}
            </div>,
          document.body,
        )
        : null}
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
        "border-[var(--aa-color-border)] hover:border-[var(--aa-color-border-strong)]",
        props.checked
          ? "bg-[var(--aa-color-selected)] text-[var(--aa-color-selected-text)] hover:bg-[var(--aa-color-selected-hover)] hover:text-[var(--aa-color-selected-hover-text)]"
          : false,
        className,
      )}
    >
      <span
        className={cx(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
        props.checked
          ? "border-[var(--aa-color-selected-border)] bg-[var(--aa-color-selected)] text-[var(--aa-color-selected-text)] hover:bg-[var(--aa-color-selected-hover)] hover:text-[var(--aa-color-selected-hover-text)]"
          : "border-[var(--aa-color-border)]",
        )}
      >
        {props.checked ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
      <span className="grid gap-0.5">
        <span className="text-[var(--aa-color-text)]">
          {label}
        </span>
        {description ? (
          <span className="text-[var(--aa-color-muted)]">
            {description}
          </span>
        ) : null}
      </span>
      <input className="sr-only" type="checkbox" {...props} />
    </label>
  );
}

export function CheckboxControl({
  darkMode,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  darkMode: boolean;
}) {
  return (
    <label
      className={cx(
        "inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border transition",
        props.disabled ? "cursor-not-allowed opacity-60" : "",
        props.checked
          ? "border-[var(--aa-color-selected-border)] bg-[var(--aa-color-selected)] text-[var(--aa-color-selected-text)] hover:bg-[var(--aa-color-selected-hover)] hover:text-[var(--aa-color-selected-hover-text)]"
          : "border-[var(--aa-color-border)] hover:border-[var(--aa-color-border-strong)] hover:bg-[var(--aa-color-control-hover)]",
        className,
      )}
    >
      {props.checked ? <Check className="h-3.5 w-3.5" /> : null}
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
