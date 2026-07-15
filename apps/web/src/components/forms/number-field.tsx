import type { InputHTMLAttributes } from "react";
import { formControlClass } from "./form-control-style";

export function NumberInput({
  darkMode,
  hasError = false,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  darkMode: boolean;
  hasError?: boolean;
}) {
  return (
    <input
      className={formControlClass(darkMode, hasError, className)}
      type="number"
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}
