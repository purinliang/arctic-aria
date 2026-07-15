import { inputColorClass } from "../color";
import { cx } from "../utils";

export function formControlClass(
  darkMode: boolean,
  hasError = false,
  className?: string,
) {
  return cx(
    "h-11 w-full rounded-md border px-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400",
    inputColorClass(darkMode, hasError),
    className,
  );
}

export function formControlPopupClass(darkMode: boolean, className?: string) {
  return cx(
    "absolute z-[70] rounded-md border p-2 shadow-xl",
    darkMode
      ? "border-neutral-700 bg-neutral-950 text-white"
      : "border-slate-200 bg-white text-slate-950",
    className,
  );
}
