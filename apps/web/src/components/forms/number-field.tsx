import type { InputHTMLAttributes } from "react";
import { formControlClass } from "./form-control-style";
import { cx } from "../utils";

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
      className={formControlClass(
        darkMode,
        hasError,
        cx(
          "appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          className,
        ),
      )}
      type="number"
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}
