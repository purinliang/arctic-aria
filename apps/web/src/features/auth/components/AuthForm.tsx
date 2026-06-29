"use client";

import { ArrowRight, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useMemo, useState } from "react";
import type { AuthMode } from "./AuthGate";
import {
  authFieldOrder,
  type AuthField,
  type AuthFieldErrors,
  type LoginInput,
  type RegisterInput,
} from "../validation";
import { AuthTextField } from "./AuthTextField";

type AuthFormProps = {
  mode: AuthMode;
  registerInput: RegisterInput;
  loginInput: LoginInput;
  errors: AuthFieldErrors;
  disabled: boolean;
  pending: boolean;
  submitMessage: string | null;
  submitError: string | null;
  onModeChange: (mode: AuthMode) => void;
  onRegisterChange: <K extends keyof RegisterInput>(
    key: K,
    value: RegisterInput[K],
  ) => void;
  onLoginChange: <K extends keyof LoginInput>(
    key: K,
    value: LoginInput[K],
  ) => void;
  onSubmit: () => void;
};

const visibleFields: Record<AuthMode, AuthField[]> = {
  login: ["username", "password"],
  register: ["username", "displayName", "password", "repeatPassword"],
};

function tabClass(active: boolean) {
  return `h-10 rounded text-sm font-semibold transition ${
    active
      ? "bg-white text-slate-950 shadow-sm"
      : "text-slate-600 hover:text-slate-950"
  }`;
}

export function AuthForm({
  mode,
  registerInput,
  loginInput,
  errors,
  disabled,
  pending,
  submitMessage,
  submitError,
  onModeChange,
  onRegisterChange,
  onLoginChange,
  onSubmit,
}: AuthFormProps) {
  const [touched, setTouched] = useState<Partial<Record<AuthField, boolean>>>({});
  const [showPassword, setShowPassword] = useState(false);

  const firstError = useMemo(() => {
    const allowed = new Set(visibleFields[mode]);

    return authFieldOrder.find((field) => allowed.has(field) && errors[field]);
  }, [errors, mode]);

  function switchMode(nextMode: AuthMode) {
    setTouched({});
    setShowPassword(false);
    onModeChange(nextMode);
  }

  function markTouched(field: AuthField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  const eyebrow = mode === "register" ? "New here?" : "Already have an account?";
  const headline = mode === "register" ? "Sign up" : "Sign in";
  const title = mode === "register" ? "Create an account" : "Welcome back";
  const buttonText = pending ? "Checking..." : headline;

  return (
    <main className="min-h-screen bg-[#eef2f5] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] items-center px-4 py-6 sm:px-6">
        <section className="w-full rounded-md border border-slate-300 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
              <LockKeyhole size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{eyebrow}</p>
              <h1 className="text-2xl font-semibold tracking-normal">{headline}</h1>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-md border border-slate-300 bg-slate-100 p-1">
            <button
              className={tabClass(mode === "login")}
              type="button"
              onClick={() => switchMode("login")}
            >
              Sign in
            </button>
            <button
              className={tabClass(mode === "register")}
              type="button"
              onClick={() => switchMode("register")}
            >
              Sign up
            </button>
          </div>

          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit();
            }}
          >
            <h2 className="text-xl font-semibold tracking-normal">{title}</h2>

            <AuthTextField
              label="Username"
              value={mode === "register" ? registerInput.username : loginInput.username}
              error={errors.username}
              touched={Boolean(touched.username)}
              autoComplete="username"
              onBlur={() => markTouched("username")}
              onChange={(value) =>
                mode === "register"
                  ? onRegisterChange("username", value)
                  : onLoginChange("username", value)
              }
            />

            {mode === "register" ? (
              <AuthTextField
                label="Display name"
                value={registerInput.displayName}
                error={errors.displayName}
                touched={Boolean(touched.displayName)}
                autoComplete="name"
                onBlur={() => markTouched("displayName")}
                onChange={(value) => onRegisterChange("displayName", value)}
              />
            ) : null}

            <AuthTextField
              label="Password"
              value={
                mode === "register" ? registerInput.password : loginInput.password
              }
              error={errors.password}
              touched={Boolean(touched.password)}
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              trailingButton={
                <button
                  className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff size={18} aria-hidden="true" />
                  ) : (
                    <Eye size={18} aria-hidden="true" />
                  )}
                </button>
              }
              onBlur={() => markTouched("password")}
              onChange={(value) =>
                mode === "register"
                  ? onRegisterChange("password", value)
                  : onLoginChange("password", value)
              }
            />

            {mode === "register" ? (
              <AuthTextField
                label="Repeat password"
                value={registerInput.repeatPassword}
                error={errors.repeatPassword}
                touched={Boolean(touched.repeatPassword)}
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                onBlur={() => markTouched("repeatPassword")}
                onChange={(value) => onRegisterChange("repeatPassword", value)}
              />
            ) : null}

            {submitError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {submitError}
              </div>
            ) : null}

            {submitMessage ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {submitMessage}
              </div>
            ) : null}

            <span
              className="mt-1 block"
              title={disabled && firstError ? errors[firstError] : undefined}
            >
              <button
                className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                type="submit"
                disabled={disabled}
              >
                {buttonText}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </span>
          </form>
        </section>
      </div>
    </main>
  );
}
