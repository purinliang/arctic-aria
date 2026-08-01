import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonHeightSmClass } from "../control-layout";
import {
  controlGapClass,
  tableCellPaddingClass,
  textTitleDescGapClass,
} from "../spacing";
import { Text } from "../text";
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
    <div className={cx("flex flex-wrap", controlGapClass, className)}>
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
    <div className={cx("flex flex-wrap", controlGapClass, className)}>
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
        "inline-flex min-w-0 max-w-full items-center whitespace-normal rounded-md border text-left font-[var(--aa-font-weight-semibold)] transition disabled:cursor-not-allowed",
        controlGapClass,
        compact
          ? cx(
              buttonHeightSmClass,
              "px-[var(--aa-space-popover-x)] text-[length:var(--aa-font-size-md)] leading-[var(--aa-line-height-md)]",
            )
          : cx(
              "min-h-[var(--aa-button-height-sm)] text-[length:var(--aa-font-size-md)] leading-[var(--aa-line-height-md)]",
              tableCellPaddingClass,
            ),
        selected
          ? "border-[var(--aa-primary-button-hover-bg)] bg-[var(--aa-primary-button-bg)] text-[var(--aa-primary-button-text)] hover:bg-[var(--aa-primary-button-hover-bg)] hover:text-[var(--aa-primary-button-hover-text)] disabled:border-[var(--aa-primary-button-disabled-bg)] disabled:bg-[var(--aa-primary-button-disabled-bg)] disabled:text-[var(--aa-primary-button-disabled-text)] disabled:hover:bg-[var(--aa-primary-button-disabled-bg)] disabled:hover:text-[var(--aa-primary-button-disabled-text)]"
          : "border-[var(--aa-secondary-button-border)] bg-[var(--aa-secondary-button-bg)] text-[var(--aa-secondary-button-text)] hover:border-[var(--aa-secondary-button-hover-border)] hover:bg-[var(--aa-secondary-button-hover-bg)] hover:text-[var(--aa-secondary-button-hover-text)] disabled:border-[var(--aa-secondary-button-disabled-border)] disabled:bg-[var(--aa-secondary-button-disabled-bg)] disabled:text-[var(--aa-secondary-button-disabled-text)] disabled:hover:border-[var(--aa-secondary-button-disabled-border)] disabled:hover:bg-[var(--aa-secondary-button-disabled-bg)] disabled:hover:text-[var(--aa-secondary-button-disabled-text)]",
        className,
      )}
      type="button"
      {...props}
    >
      {option.icon}
      <span className="min-w-0 break-words">
        <Text tone="current" weight="semibold" className="break-words">
          {option.label}
        </Text>
        {option.description ? (
          <Text
            as="span"
            size="sm"
            weight="normal"
            tone="current"
            className={cx(
              "block",
              textTitleDescGapClass,
              selected ? "opacity-80" : undefined,
            )}
          >
            {option.description}
          </Text>
        ) : null}
      </span>
    </button>
  );
}
