"use client";

import { useState, useTransition } from "react";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { loginUser, registerUser } from "../actions";
import {
  hasAuthErrors,
  validateLoginTyping,
  validateRegisterTyping,
  type AuthFieldErrors,
  type LoginInput,
  type RegisterInput,
} from "../validation";
import { AuthForm } from "./AuthForm";

export type AuthMode = "login" | "register";

const emptyRegister: RegisterInput = {
  username: "",
  displayName: "",
  password: "",
  repeatPassword: "",
};

const emptyLogin: LoginInput = {
  username: "",
  password: "",
};

export function AuthGate() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [registerInput, setRegisterInput] = useState<RegisterInput>(emptyRegister);
  const [loginInput, setLoginInput] = useState<LoginInput>(emptyLogin);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<AuthFieldErrors>({});
  const [isPending, startTransition] = useTransition();

  if (authenticated) {
    return <Dashboard />;
  }

  const typingErrors =
    mode === "register"
      ? validateRegisterTyping(registerInput)
      : validateLoginTyping(loginInput);
  const activeErrors = { ...typingErrors, ...serverErrors };

  function resetSubmitState() {
    setSubmitMessage(null);
    setSubmitError(null);
    setServerErrors({});
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    resetSubmitState();
  }

  function updateRegister<K extends keyof RegisterInput>(
    key: K,
    value: RegisterInput[K],
  ) {
    resetSubmitState();
    setRegisterInput((current) => ({ ...current, [key]: value }));
  }

  function updateLogin<K extends keyof LoginInput>(key: K, value: LoginInput[K]) {
    resetSubmitState();
    setLoginInput((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit() {
    resetSubmitState();

    startTransition(async () => {
      const result =
        mode === "register"
          ? await registerUser(registerInput)
          : await loginUser(loginInput);

      if (!result.ok) {
        setSubmitError(result.message);
        setServerErrors(result.fieldErrors ?? {});
        console.warn("[auth-ui]", `${mode}_failed`, {
          fields: result.fieldErrors ? Object.keys(result.fieldErrors) : [],
        });
        return;
      }

      setSubmitMessage(result.message);
      console.info("[auth-ui]", `${mode}_success`, {
        displayName: result.displayName,
      });

      window.setTimeout(() => {
        setSubmitMessage(null);
        setAuthenticated(true);
      }, 2000);
    });
  }

  return (
    <AuthForm
      mode={mode}
      registerInput={registerInput}
      loginInput={loginInput}
      errors={activeErrors}
      disabled={isPending || hasAuthErrors(activeErrors)}
      pending={isPending}
      submitMessage={submitMessage}
      submitError={submitError}
      onModeChange={switchMode}
      onRegisterChange={updateRegister}
      onLoginChange={updateLogin}
      onSubmit={handleSubmit}
    />
  );
}
