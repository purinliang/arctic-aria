import type { TextareaHTMLAttributes } from "react";
import { formControlClass } from "./form-control-style";
import { cx } from "../utils";

export function TextArea({
  darkMode,
  hasError = false,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  darkMode: boolean;
  hasError?: boolean;
}) {
  return (
    <textarea
      className={cx(
        formControlClass(darkMode, hasError),
        "h-auto min-h-24 resize-y py-2",
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}
