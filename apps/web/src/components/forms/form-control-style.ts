import { inputColorClass } from "../color";
import { cx } from "../utils";

export function formControlClass(
  darkMode: boolean,
  hasError = false,
  className?: string,
) {
  return cx(
    "h-11 w-full rounded-md border px-3 text-sm shadow-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-100 disabled:shadow-none",
    inputColorClass(darkMode, hasError),
    "placeholder:text-[var(--aa-color-muted)] disabled:border-[var(--aa-color-border)] disabled:bg-[var(--aa-color-control-muted)] disabled:text-[var(--aa-color-muted)] disabled:placeholder:text-[var(--aa-color-muted)]",
    className,
  );
}

export function formControlPopupClass(darkMode: boolean, className?: string) {
  return cx(
    "absolute z-[70] rounded-md border p-2 shadow-xl",
    "border-[var(--aa-color-border)] bg-[var(--aa-color-surface)] text-[var(--aa-color-text)]",
    className,
  );
}
