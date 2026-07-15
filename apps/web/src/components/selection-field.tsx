import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { Check } from "lucide-react";
import { formControlClass } from "./form-control-style";
import { cx } from "./utils";

export function SelectInput({
  darkMode,
  hasError = false,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  darkMode: boolean;
  hasError?: boolean;
}) {
  return (
    <select
      className={formControlClass(darkMode, hasError, className)}
      aria-invalid={hasError || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function CheckboxField({
  darkMode,
  label,
  description,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  darkMode: boolean;
  label: ReactNode;
  description?: ReactNode;
}) {
  return (
    <label
      className={cx(
        "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 text-sm transition",
        darkMode
          ? "border-neutral-800 hover:border-neutral-600"
          : "border-slate-200 hover:border-slate-300",
        props.checked
          ? darkMode
            ? "bg-white/10"
            : "bg-slate-50"
          : false,
        className,
      )}
    >
      <span
        className={cx(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
          props.checked
            ? darkMode
              ? "border-white bg-white text-black"
              : "border-slate-950 bg-slate-950 text-white"
            : darkMode
              ? "border-neutral-600"
              : "border-slate-300",
        )}
      >
        {props.checked ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
      <span className="grid gap-0.5">
        <span className={darkMode ? "text-white" : "text-slate-950"}>
          {label}
        </span>
        {description ? (
          <span className={darkMode ? "text-neutral-400" : "text-slate-500"}>
            {description}
          </span>
        ) : null}
      </span>
      <input className="sr-only" type="checkbox" {...props} />
    </label>
  );
}

export function CheckboxGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("grid gap-2", className)}>{children}</div>;
}
