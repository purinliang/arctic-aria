import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { inputColorClass } from "./color";
import { LabelText } from "./text";
import { cx } from "./utils";

export function FieldLabel({
  darkMode,
  label,
  optional = false,
  children,
}: {
  darkMode: boolean;
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="relative grid gap-1.5">
      <LabelText darkMode={darkMode}>
        {label}
        {optional ? (
          <span className={darkMode ? "font-normal text-neutral-400" : "font-normal text-slate-500"}>
            {" "}
            (Optional)
          </span>
        ) : null}
      </LabelText>
      {children}
    </label>
  );
}

export function TextInput({
  darkMode,
  hasError = false,
  trailing,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  darkMode: boolean;
  hasError?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <span className="relative block">
      <input
        className={cx(
          inputBaseClass(darkMode, hasError),
          trailing ? "pr-11" : false,
          className,
        )}
        aria-invalid={hasError || undefined}
        {...props}
      />
      {trailing ? (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          {trailing}
        </span>
      ) : null}
    </span>
  );
}

export function NumberInput(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    darkMode: boolean;
    hasError?: boolean;
  },
) {
  return <TextInput {...props} type="number" />;
}

export function DateInput(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    darkMode: boolean;
    hasError?: boolean;
  },
) {
  return <TextInput {...props} type="date" />;
}

export function TimeInput(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    darkMode: boolean;
    hasError?: boolean;
  },
) {
  return <TextInput {...props} type="time" />;
}

export function PasswordInput(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    darkMode: boolean;
    hasError?: boolean;
    trailing?: ReactNode;
  },
) {
  return <TextInput {...props} type="password" />;
}

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
      className={cx(inputBaseClass(darkMode, hasError), "resize-y", className)}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
}

export function FieldError({
  darkMode,
  children,
}: {
  darkMode: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "absolute left-3 top-[calc(100%+8px)] z-20 max-w-[min(280px,calc(100vw-48px))] rounded-md border px-3 py-2 text-sm leading-5 shadow-lg",
        darkMode
          ? "border-red-400/40 bg-red-950 text-red-50"
          : "border-red-200 bg-red-50 text-red-700",
      )}
    >
      <span
        className={cx(
          "absolute -top-1 left-4 h-2 w-2 rotate-45 border-l border-t",
          darkMode
            ? "border-red-400/40 bg-red-950"
            : "border-red-200 bg-red-50",
        )}
      />
      {children}
    </span>
  );
}

function inputBaseClass(darkMode: boolean, hasError: boolean) {
  return cx(
    "h-11 w-full rounded-md border px-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400",
    inputColorClass(darkMode, hasError),
  );
}
