"use client";

import { LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { AppShell } from "@/app-shell/AppShell";
import { SupportingText } from "@/components/text";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "../actions";
import type { AuthUser } from "../server/auth-service";
import {
  hasAuthErrors,
  validateLoginSubmit,
  validateLoginTyping,
  validateRegisterSubmit,
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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [registerInput, setRegisterInput] = useState<RegisterInput>(emptyRegister);
  const [loginInput, setLoginInput] = useState<LoginInput>(emptyLogin);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<AuthFieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;

    getCurrentUser()
      .then((user) => {
        if (active) {
          setCurrentUser(user);
        }
      })
      .finally(() => {
        if (active) {
          setSessionChecked(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (!sessionChecked) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eef2f5] px-4 text-slate-950">
        <div
          className="grid justify-items-center gap-4 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={22} aria-hidden="true" />
            <h1 className="text-2xl font-semibold tracking-normal">Arctic Aria</h1>
          </div>
          <div className="flex items-center justify-center gap-2">
            <LoaderCircle
              size={18}
              className="animate-spin text-slate-500"
              aria-hidden="true"
            />
            <SupportingText darkMode={false} className="font-medium">
              Opening your workspace...
            </SupportingText>
          </div>
        </div>
      </main>
    );
  }

  if (currentUser) {
    return (
      <AppShell
        currentUser={currentUser}
        logoutPending={isPending}
        onLogout={() => {
          startTransition(async () => {
            await logoutUser();
            setCurrentUser(null);
            resetSubmitState(true);
          });
        }}
      />
    );
  }

  const typingErrors =
    mode === "register"
      ? validateRegisterTyping(registerInput)
      : validateLoginTyping(loginInput);
  const submitErrors = submitAttempted
    ? mode === "register"
      ? validateRegisterSubmit(registerInput)
      : validateLoginSubmit(loginInput)
    : {};
  const activeErrors = { ...typingErrors, ...submitErrors, ...serverErrors };

  function resetSubmitState(resetAttempt = false) {
    setSubmitMessage(null);
    setSubmitError(null);
    setServerErrors({});

    if (resetAttempt) {
      setSubmitAttempted(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    resetSubmitState(true);
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
    setSubmitAttempted(true);

    const fieldErrors =
      mode === "register"
        ? validateRegisterSubmit(registerInput)
        : validateLoginSubmit(loginInput);

    if (hasAuthErrors(fieldErrors)) {
      setSubmitError("Please fix the highlighted fields.");
      return;
    }

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
        setCurrentUser(result.user);
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
      submitAttempted={submitAttempted}
      submitMessage={submitMessage}
      submitError={submitError}
      onModeChange={switchMode}
      onRegisterChange={updateRegister}
      onLoginChange={updateLogin}
      onSubmit={handleSubmit}
    />
  );
}
