"use client";

// Auth Page - Auth Text Field.
import type { ReactNode } from "react";
import {
  FieldError,
  FieldLabel,
  TextInput,
} from "@/components/forms/input-field";

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
    <FieldLabel darkMode={false} label={label} optional={optional}>
      <TextInput
        darkMode={false}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        autoComplete={autoComplete}
        hasError={showError}
        trailing={trailingButton}
      />
      {showError ? <FieldError darkMode={false}>{error}</FieldError> : null}
    </FieldLabel>
  );
}
