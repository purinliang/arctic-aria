"use client";

import { ArrowRight, Eye, EyeOff, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { InlineMessage } from "@/components/ui/text";
import type { AuthMode } from "./AuthGate";
import {
  authFieldOrder,
  type AuthField,
  type AuthFieldErrors,
  type LoginInput,
  type RegisterInput,
} from "../validation";
import { AuthTextField } from "./AuthTextField";
import { GoogleIcon } from "./GoogleIcon";

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

  const title = mode === "register" ? "Create an account" : "Welcome back";
  const buttonText = pending
    ? "Checking..."
    : mode === "register"
      ? "Sign up"
      : "Sign in";
  const switchPrompt =
    mode === "register" ? "Already have an account?" : "New here?";
  const switchLabel = mode === "register" ? "Sign in" : "Sign up";
  const switchTarget = mode === "register" ? "login" : "register";

  return (
    <main className="min-h-screen bg-[#eef2f5] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] items-center px-4 py-6 sm:px-6">
        <Panel darkMode={false} className="w-full p-5 shadow-sm sm:p-8">
          <div className="flex items-center justify-center gap-2 text-slate-950">
            <Sparkles size={22} aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-normal">Arctic Aria</h1>
          </div>
          <p className="mx-auto mb-8 mt-2 max-w-[320px] text-center text-sm leading-6 text-slate-500">
            Your personal life assistant under the aurora.
          </p>

          <div className="mb-6 grid grid-cols-2 rounded-md border border-slate-300 bg-slate-100 p-1">
            <Button
              darkMode={false}
              tone={mode === "login" ? "primary" : "ghost"}
              size="md"
              className="h-10"
              onClick={() => switchMode("login")}
            >
              Sign in
            </Button>
            <Button
              darkMode={false}
              tone={mode === "register" ? "primary" : "ghost"}
              size="md"
              className="h-10"
              onClick={() => switchMode("register")}
            >
              Sign up
            </Button>
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
                optional
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
                <Button
                  darkMode={false}
                  tone="ghost"
                  size="icon-sm"
                  className="h-8 w-8"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  icon={
                    showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )
                  }
                />
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
                trailingButton={
                  <Button
                    darkMode={false}
                    tone="ghost"
                    size="icon-sm"
                    className="h-8 w-8"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    icon={
                      showPassword ? (
                        <EyeOff size={18} aria-hidden="true" />
                      ) : (
                        <Eye size={18} aria-hidden="true" />
                      )
                    }
                  />
                }
                onBlur={() => markTouched("repeatPassword")}
                onChange={(value) => onRegisterChange("repeatPassword", value)}
              />
            ) : null}

            {submitError ? (
              <InlineMessage darkMode={false} tone="red">
                {submitError}
              </InlineMessage>
            ) : null}

            {submitMessage ? (
              <InlineMessage darkMode={false} tone="emerald">
                {submitMessage}
              </InlineMessage>
            ) : null}

            <span
              className="mt-1 block"
              title={disabled && firstError ? errors[firstError] : undefined}
            >
              <Button
                darkMode={false}
                tone="primary"
                size="md"
                className="w-full"
                type="submit"
                disabled={disabled}
                icon={<ArrowRight size={17} aria-hidden="true" />}
              >
                {buttonText}
              </Button>
            </span>

            {mode === "login" ? (
              <>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm text-slate-400">
                  <span className="h-px bg-slate-200" />
                  <span>or</span>
                  <span className="h-px bg-slate-200" />
                </div>

                <Button
                  darkMode={false}
                  size="md"
                  icon={<GoogleIcon />}
                >
                  Continue with Google
                </Button>

                <p className="text-center text-sm text-slate-600">
                  Forgot your password?{" "}
                  <button
                    className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                    type="button"
                  >
                    Reset password
                  </button>
                </p>
              </>
            ) : null}

            <p className="text-center text-sm text-slate-600">
              {switchPrompt}{" "}
              <button
                className="font-semibold text-slate-950 underline-offset-4 hover:underline"
                type="button"
                onClick={() => switchMode(switchTarget)}
              >
                {switchLabel}
              </button>
            </p>
          </form>
        </Panel>
      </div>
    </main>
  );
}
