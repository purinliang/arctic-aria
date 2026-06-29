"use client";

import type { ReactNode } from "react";

type AuthTextFieldProps = {
  label: string;
  optional?: boolean;
  value: string;
  error?: string;
  touched: boolean;
  type?: "text" | "password";
  autoComplete?: string;
  trailingButton?: ReactNode;
  onBlur: () => void;
  onChange: (value: string) => void;
};

function inputClass(hasError: boolean) {
  return `h-11 w-full rounded-md border bg-white px-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 ${
    hasError
      ? "border-red-500 focus:border-red-600"
      : "border-slate-300 focus:border-blue-600"
  }`;
}

export function AuthTextField({
  label,
  optional = false,
  value,
  error,
  touched,
  type = "text",
  autoComplete,
  trailingButton,
  onBlur,
  onChange,
}: AuthTextFieldProps) {
  const showError = touched && Boolean(error);

  return (
    <label className="relative grid gap-1.5">
      <span className="text-left text-sm font-medium text-slate-700">
        {label}
        {optional ? (
          <span className="font-normal text-slate-500"> (Optional)</span>
        ) : null}
      </span>
      <span className="relative block">
        <input
          className={`${inputClass(showError)} ${trailingButton ? "pr-11" : ""}`}
          value={value}
          onBlur={onBlur}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          autoComplete={autoComplete}
          aria-invalid={showError}
        />
        {trailingButton ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2">
            {trailingButton}
          </span>
        ) : null}
        {showError ? (
          <span className="absolute left-3 top-[calc(100%+8px)] z-20 max-w-[min(280px,calc(100vw-48px))] rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-5 text-red-700 shadow-lg">
            <span className="absolute -top-1 left-4 h-2 w-2 rotate-45 border-l border-t border-red-200 bg-red-50" />
            {error}
          </span>
        ) : null}
      </span>
    </label>
  );
}
