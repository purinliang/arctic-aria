import { inputColorClass } from "../color";
import { cx } from "../utils";

export function formControlClass(
  darkMode: boolean,
  hasError = false,
  className?: string,
) {
  return cx(
    "h-11 w-full rounded-md border px-3 text-sm shadow-sm outline-none transition placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-100 disabled:shadow-none",
    inputColorClass(darkMode, hasError),
    darkMode
      ? "disabled:border-neutral-800 disabled:bg-neutral-900 disabled:text-neutral-500 disabled:placeholder:text-neutral-600"
      : "disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:placeholder:text-neutral-300",
    className,
  );
}

export function formControlPopupClass(darkMode: boolean, className?: string) {
  return cx(
    "absolute z-[70] rounded-md border p-2 shadow-xl",
    darkMode
      ? "border-[var(--aa-grey-16)] bg-[var(--aa-grey-3)] text-[var(--aa-grey-63)]"
      : "border-[var(--aa-grey-52)] bg-[var(--aa-grey-63)] text-[var(--aa-grey-0)]",
    className,
  );
}
