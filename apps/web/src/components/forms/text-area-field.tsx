import type { TextareaHTMLAttributes } from "react";
import { textAreaMinHeightMdClass } from "../control-layout";
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
        "h-auto resize-y py-[var(--aa-space-table-cell-y)]",
        textAreaMinHeightMdClass,
        className,
      )}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}
