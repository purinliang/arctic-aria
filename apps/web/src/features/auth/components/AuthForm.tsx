"use client";

// Auth Page - Auth Form.
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/button";
import {
  panelHoverContainerColorClass,
  secondaryTextColorClass,
  secondaryButtonBorderColorClass,
} from "@/components/color";
import { PendingText } from "@/components/loading";
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
import type { AuthMessages } from "@/messages/app-messages";

export type AuthFormProps = {
  darkMode: boolean;
  messages: AuthMessages;
  mode: AuthMode;
  registerInput: RegisterInput;
  loginInput: LoginInput;
  errors: AuthFieldErrors;
  disabled: boolean;
  pending: boolean;
  submitAttempted: boolean;
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
  onGoogleLogin: () => void;
  onPasswordReset: () => void;
};

const visibleFields: Record<AuthMode, AuthField[]> = {
  login: ["username", "password"],
  register: ["username", "displayName", "password", "repeatPassword"],
};

const showFutureAuthActions = false;

export function AuthForm({
  darkMode,
  messages,
  mode,
  registerInput,
  loginInput,
  errors,
  disabled,
  pending,
  submitAttempted,
  onModeChange,
  onRegisterChange,
  onLoginChange,
  onSubmit,
  onGoogleLogin,
  onPasswordReset,
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

  const title =
    mode === "register" ? messages.form.createAccount : messages.form.welcomeBack;
  const buttonText =
    mode === "register" ? messages.form.signUp : messages.form.signIn;
  const pendingButtonText =
    mode === "register" ? messages.form.signingUp : messages.form.signingIn;
  const switchPrompt =
    mode === "register"
      ? messages.form.alreadyHaveAccount
      : messages.form.newHere;
  const switchLabel =
    mode === "register" ? messages.form.signIn : messages.form.signUp;
  const switchTarget = mode === "register" ? "login" : "register";
  const showSubmitErrors = submitAttempted;

  return (
    <>
      <div
        className={`mb-6 grid grid-cols-2 rounded-md border p-1 ${panelHoverContainerColorClass}`}
      >
        <Button
          darkMode={darkMode}
          tone={mode === "login" ? "primary" : "ghost"}
          size="md"
          className="h-10"
          onClick={() => switchMode("login")}
        >
          {messages.form.signIn}
        </Button>
        <Button
          darkMode={darkMode}
          tone={mode === "register" ? "primary" : "ghost"}
          size="md"
          className="h-10"
          onClick={() => switchMode("register")}
        >
          {messages.form.signUp}
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
          darkMode={darkMode}
          label={messages.fields.username}
          value={mode === "register" ? registerInput.username : loginInput.username}
          error={errors.username}
          touched={Boolean(touched.username || showSubmitErrors)}
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
            darkMode={darkMode}
            label={messages.fields.displayName}
            optional
            value={registerInput.displayName}
            error={errors.displayName}
            touched={Boolean(touched.displayName || showSubmitErrors)}
            autoComplete="name"
            onBlur={() => markTouched("displayName")}
            onChange={(value) => onRegisterChange("displayName", value)}
          />
        ) : null}

        <AuthTextField
          darkMode={darkMode}
          label={messages.fields.password}
          value={
            mode === "register" ? registerInput.password : loginInput.password
          }
          error={errors.password}
          touched={Boolean(touched.password || showSubmitErrors)}
          type={showPassword ? "text" : "password"}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          trailingButton={
            <Button
              darkMode={darkMode}
              tone="ghost"
              size="icon-sm"
              className="h-8 w-8"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={
                showPassword
                  ? messages.form.hidePassword
                  : messages.form.showPassword
              }
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
            darkMode={darkMode}
            label={messages.fields.repeatPassword}
            value={registerInput.repeatPassword}
            error={errors.repeatPassword}
            touched={Boolean(touched.repeatPassword || showSubmitErrors)}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            trailingButton={
              <Button
                darkMode={darkMode}
                tone="ghost"
                size="icon-sm"
                className="h-8 w-8"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={
                  showPassword
                    ? messages.form.hidePassword
                    : messages.form.showPassword
                }
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

        <span
          className="mt-1 block"
          title={disabled && firstError ? errors[firstError] : undefined}
        >
          <Button
            darkMode={darkMode}
            tone="primary"
            size="md"
            className="w-full"
            type="submit"
            disabled={disabled}
            icon={<ArrowRight size={17} aria-hidden="true" />}
          >
            <PendingText
              active={pending}
              idleText={buttonText}
              pendingText={pendingButtonText}
            />
          </Button>
        </span>

        {showFutureAuthActions && mode === "login" ? (
          <>
            <div
              className={`grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-sm ${secondaryTextColorClass}`}
            >
              <span className={`h-px border-t ${secondaryButtonBorderColorClass}`} />
              <span>{messages.form.or}</span>
              <span className={`h-px border-t ${secondaryButtonBorderColorClass}`} />
            </div>

            <Button
              darkMode={darkMode}
              size="md"
              icon={<GoogleIcon />}
              onClick={onGoogleLogin}
            >
              {messages.form.continueWithGoogle}
            </Button>

            <p className={`text-center text-sm ${secondaryTextColorClass}`}>
              {messages.form.forgotPassword}{" "}
              <Button
                darkMode={darkMode}
                tone="ghost"
                size="xs"
                className="inline-flex h-auto px-0 text-sm underline-offset-4 hover:underline"
                onClick={onPasswordReset}
              >
                {messages.form.resetPassword}
              </Button>
            </p>
          </>
        ) : null}

        <p className={`text-center text-sm ${secondaryTextColorClass}`}>
          {switchPrompt}{" "}
          <Button
            darkMode={darkMode}
            tone="ghost"
            size="xs"
            className="inline-flex h-auto px-0 text-sm underline-offset-4 hover:underline"
            onClick={() => switchMode(switchTarget)}
          >
            {switchLabel}
          </Button>
        </p>
      </form>
    </>
  );
}
