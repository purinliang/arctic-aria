import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "../utils";

type ChoiceGroupSize = "button" | "field";

export type ChoiceOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
};

export function SingleChoiceGroup({
  darkMode,
  options,
  value,
  onChange,
  disabled = false,
  size = "button",
  className,
  children,
}: {
  darkMode: boolean;
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  size?: ChoiceGroupSize;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cx("flex flex-wrap gap-2", className)}>
      <div className="contents" role="radiogroup">
        {options.map((option) => (
          <ChoiceButton
            key={option.value}
            darkMode={darkMode}
            option={option}
            selected={option.value === value}
            disabled={disabled}
            size={size}
            role="radio"
            aria-checked={option.value === value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
      {children}
    </div>
  );
}

export function MultipleChoiceGroup({
  darkMode,
  options,
  values,
  onChange,
  disabled = false,
  size = "button",
  className,
}: {
  darkMode: boolean;
  options: ChoiceOption[];
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  size?: ChoiceGroupSize;
  className?: string;
}) {
  const selectedValues = new Set(values);

  return (
    <div className={cx("flex flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = selectedValues.has(option.value);

        return (
          <ChoiceButton
            key={option.value}
            darkMode={darkMode}
            option={option}
            selected={selected}
            disabled={disabled}
            size={size}
            aria-pressed={selected}
            onClick={() => {
              onChange(
                selected
                  ? values.filter((value) => value !== option.value)
                  : [...values, option.value],
              );
            }}
          />
        );
      })}
    </div>
  );
}

export function ChoiceActionButton({
  darkMode,
  option,
  disabled = false,
  size = "button",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  darkMode: boolean;
  option: ChoiceOption;
  disabled?: boolean;
  size?: ChoiceGroupSize;
}) {
  return (
    <ChoiceButton
      darkMode={darkMode}
      option={option}
      selected={false}
      disabled={disabled}
      size={size}
      className={className}
      {...props}
    />
  );
}

function ChoiceButton({
  darkMode,
  option,
  selected,
  size,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  darkMode: boolean;
  option: ChoiceOption;
  selected: boolean;
  size: ChoiceGroupSize;
}) {
  const compact = size === "button" && !option.description;

  return (
    <button
      className={cx(
        "inline-flex items-center gap-2 rounded-md border text-left font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        compact ? "h-9 px-3 text-xs" : "min-h-11 px-3 py-2 text-sm",
        selected
          ? "border-[var(--aa-color-selected-border)] bg-[var(--aa-color-selected)] text-[var(--aa-color-selected-text)] hover:bg-[var(--aa-color-selected-hover)] hover:text-[var(--aa-color-selected-hover-text)]"
          : "border-[var(--aa-color-border)] text-[var(--aa-color-muted)] hover:border-[var(--aa-color-border-strong)] hover:bg-[var(--aa-color-control-hover)] hover:text-[var(--aa-color-text)]",
        className,
      )}
      type="button"
      {...props}
    >
      {option.icon}
      <span className="grid gap-0.5">
        <span>{option.label}</span>
        {option.description ? (
          <span
            className={cx(
              "text-xs font-normal",
              selected
                ? "text-[var(--aa-color-selected-text)] opacity-80"
                : "text-[var(--aa-color-muted)]",
            )}
          >
            {option.description}
          </span>
        ) : null}
      </span>
    </button>
  );
}
