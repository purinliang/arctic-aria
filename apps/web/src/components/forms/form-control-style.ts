import { formControlHeightClass } from "../control-layout";
import { textInputControlColorClass } from "../color";
import { popoverPaddingClass } from "../spacing";
import { cx } from "../utils";

export function formControlClass(
  darkMode: boolean,
  hasError = false,
  className?: string,
) {
  return cx(
    "aa-text-input-control w-full cursor-text rounded-md border px-[var(--aa-space-popover-x)] text-[length:var(--aa-font-size-md)] font-[var(--aa-font-weight-normal)] leading-[var(--aa-line-height-md)] caret-[var(--aa-text-input-text)] shadow-sm outline-none transition focus:shadow-[inset_0_0_0_1px_var(--aa-text-input-focus-border)] disabled:cursor-not-allowed disabled:opacity-100 disabled:shadow-none",
    formControlHeightClass,
    textInputControlColorClass(darkMode, hasError),
    "hover:border-[var(--aa-text-input-hover-border)] hover:bg-[var(--aa-text-input-hover-bg)] hover:text-[var(--aa-text-input-hover-text)] placeholder:text-[var(--aa-text-input-placeholder-text)]",
    "focus:hover:border-[var(--aa-text-input-hover-border)] focus:hover:bg-[var(--aa-text-input-hover-bg)] focus:hover:text-[var(--aa-text-input-hover-text)]",
    "disabled:border-[var(--aa-text-input-disabled-border)] disabled:bg-[var(--aa-text-input-disabled-bg)] disabled:text-[var(--aa-text-input-disabled-text)] disabled:placeholder:text-[var(--aa-text-input-disabled-text)] disabled:hover:border-[var(--aa-text-input-disabled-border)] disabled:hover:bg-[var(--aa-text-input-disabled-bg)] disabled:hover:text-[var(--aa-text-input-disabled-text)]",
    className,
  );
}

export function formControlPopupClass(darkMode: boolean, className?: string) {
  return cx(
    "absolute z-[70]",
    formControlPopupPanelClass(darkMode, className),
  );
}

export function formControlPopupPanelClass(
  darkMode: boolean,
  className?: string,
) {
  return cx(
    "rounded-md border shadow-xl",
    popoverPaddingClass,
    "border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-bg)] text-[var(--aa-primary-text)]",
    className,
  );
}

export function formButtonControlClass(
  darkMode: boolean,
  hasError = false,
  className?: string,
) {
  return cx(
    "aa-form-button-control w-full cursor-pointer rounded-md border px-[var(--aa-space-popover-x)] text-[length:var(--aa-font-size-md)] font-[var(--aa-font-weight-normal)] leading-[var(--aa-line-height-md)] shadow-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-100 disabled:shadow-none",
    formControlHeightClass,
    hasError
      ? cx(
          darkMode ? "border-red-400" : "border-red-500",
          "bg-[var(--aa-secondary-button-bg)] text-[var(--aa-secondary-button-text)] focus:border-[var(--aa-secondary-button-hover-border)]",
        )
      : "border-[var(--aa-secondary-button-border)] bg-[var(--aa-secondary-button-bg)] text-[var(--aa-secondary-button-text)] focus:border-[var(--aa-secondary-button-hover-border)]",
    "hover:border-[var(--aa-secondary-button-hover-border)] hover:bg-[var(--aa-secondary-button-hover-bg)] hover:text-[var(--aa-secondary-button-hover-text)]",
    "disabled:border-[var(--aa-secondary-button-disabled-border)] disabled:bg-[var(--aa-secondary-button-disabled-bg)] disabled:text-[var(--aa-secondary-button-disabled-text)] disabled:hover:border-[var(--aa-secondary-button-disabled-border)] disabled:hover:bg-[var(--aa-secondary-button-disabled-bg)] disabled:hover:text-[var(--aa-secondary-button-disabled-text)]",
    className,
  );
}
