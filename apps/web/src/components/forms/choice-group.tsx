import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonHeightSmClass } from "../control-layout";
import { cx } from "../utils";

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
  className,
  children,
}: {
  darkMode: boolean;
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
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
  className,
}: {
  darkMode: boolean;
  options: ChoiceOption[];
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
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
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  darkMode: boolean;
  option: ChoiceOption;
  disabled?: boolean;
}) {
  return (
    <ChoiceButton
      darkMode={darkMode}
      option={option}
      selected={false}
      disabled={disabled}
      className={className}
      {...props}
    />
  );
}

function ChoiceButton({
  darkMode,
  option,
  selected,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  darkMode: boolean;
  option: ChoiceOption;
  selected: boolean;
}) {
  void darkMode;

  const compact = !option.description;

  return (
    <button
      className={cx(
        "inline-flex items-center gap-2 rounded-md border text-left font-semibold transition disabled:cursor-not-allowed",
        compact
          ? cx(buttonHeightSmClass, "px-3 text-sm")
          : "min-h-[var(--aa-button-height-sm)] px-3 py-2 text-sm",
        selected
          ? "border-[var(--aa-primary-button-hover-bg)] bg-[var(--aa-primary-button-bg)] text-[var(--aa-primary-button-text)] hover:bg-[var(--aa-primary-button-hover-bg)] hover:text-[var(--aa-primary-button-hover-text)] disabled:border-[var(--aa-primary-button-disabled-bg)] disabled:bg-[var(--aa-primary-button-disabled-bg)] disabled:text-[var(--aa-primary-button-disabled-text)] disabled:hover:bg-[var(--aa-primary-button-disabled-bg)] disabled:hover:text-[var(--aa-primary-button-disabled-text)]"
          : "border-[var(--aa-secondary-button-border)] bg-[var(--aa-secondary-button-bg)] text-[var(--aa-secondary-button-text)] hover:border-[var(--aa-secondary-button-hover-border)] hover:bg-[var(--aa-secondary-button-hover-bg)] hover:text-[var(--aa-secondary-button-hover-text)] disabled:border-[var(--aa-secondary-button-disabled-border)] disabled:bg-[var(--aa-secondary-button-disabled-bg)] disabled:text-[var(--aa-secondary-button-disabled-text)] disabled:hover:border-[var(--aa-secondary-button-disabled-border)] disabled:hover:bg-[var(--aa-secondary-button-disabled-bg)] disabled:hover:text-[var(--aa-secondary-button-disabled-text)]",
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
                ? "text-[var(--aa-primary-button-text)] opacity-80"
                : "text-[var(--aa-secondary-button-text)]",
            )}
          >
            {option.description}
          </span>
        ) : null}
      </span>
    </button>
  );
}
