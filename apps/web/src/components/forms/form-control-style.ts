import { secondaryInputControlColorClass } from "../color";
import { cx } from "../utils";

export function formControlClass(
  darkMode: boolean,
  hasError = false,
  className?: string,
) {
  return cx(
    "h-11 w-full rounded-md border px-3 text-sm shadow-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-100 disabled:shadow-none",
    secondaryInputControlColorClass(darkMode, hasError),
    hasError
      ? "hover:border-[var(--aa-secondary-button-hover-border)] hover:bg-[var(--aa-secondary-button-hover-bg)] placeholder:text-[var(--aa-secondary-text)]"
      : "hover:border-[var(--aa-secondary-button-hover-border)] hover:bg-[var(--aa-secondary-button-hover-bg)] focus:border-[var(--aa-secondary-button-hover-border)] focus:bg-[var(--aa-secondary-button-hover-bg)] placeholder:text-[var(--aa-secondary-text)]",
    "disabled:border-[var(--aa-secondary-button-disabled-border)] disabled:bg-[var(--aa-secondary-button-disabled-bg)] disabled:text-[var(--aa-secondary-button-disabled-text)] disabled:placeholder:text-[var(--aa-secondary-button-disabled-text)] disabled:hover:border-[var(--aa-secondary-button-disabled-border)] disabled:hover:bg-[var(--aa-secondary-button-disabled-bg)]",
    className,
  );
}

export function formControlPopupClass(darkMode: boolean, className?: string) {
  return cx(
    "absolute z-[70] rounded-md border p-2 shadow-xl",
    "border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-bg)] text-[var(--aa-primary-text)]",
    className,
  );
}
