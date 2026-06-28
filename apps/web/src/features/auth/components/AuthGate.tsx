"use client";

import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { Dashboard } from "@/features/dashboard/components/Dashboard";
import { loginUser, registerUser } from "../actions";
import {
  hasAuthErrors,
  validateLoginTyping,
  validateRegisterTyping,
  type AuthField,
  type AuthFieldErrors,
  type LoginInput,
  type RegisterInput,
} from "../validation";

type AuthMode = "register" | "login";

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

function fieldError(errors: AuthFieldErrors, field: AuthField) {
  return errors[field] ?? "";
}

function inputClass(hasError: boolean) {
  return `h-11 w-full rounded-md border bg-white px-3 text-sm text-slate-950 shadow-sm transition placeholder:text-slate-400 ${
    hasError
      ? "border-red-500 focus:border-red-600"
      : "border-slate-300 focus:border-blue-600"
  }`;
}

export function AuthGate() {
  const [authenticated, setAuthenticated] = useState(false);
  const [mode, setMode] = useState<AuthMode>("register");
  const [registerInput, setRegisterInput] = useState<RegisterInput>(emptyRegister);
  const [loginInput, setLoginInput] = useState<LoginInput>(emptyLogin);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<AuthFieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  const registerErrors = useMemo(
    () => ({ ...validateRegisterTyping(registerInput), ...serverErrors }),
    [registerInput, serverErrors],
  );
  const loginErrors = useMemo(
    () => ({ ...validateLoginTyping(loginInput), ...serverErrors }),
    [loginInput, serverErrors],
  );
  const activeErrors = mode === "register" ? registerErrors : loginErrors;
  const submitDisabled =
    isPending ||
    hasAuthErrors(activeErrors) ||
    (mode === "register"
      ? hasAuthErrors(validateRegisterTyping(registerInput))
      : hasAuthErrors(validateLoginTyping(loginInput)));

  if (authenticated) {
    return <Dashboard />;
  }

  function resetSubmitState() {
    setSubmitMessage(null);
    setSubmitError(null);
    setServerErrors({});
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    resetSubmitState();
    setShowPassword(false);
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
    <main className="min-h-screen bg-[#eef2f5] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1200px] items-center px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid w-full overflow-hidden rounded-md border border-slate-300 bg-white shadow-sm lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="hidden min-h-[620px] bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white text-slate-950">
                <LockKeyhole size={22} aria-hidden="true" />
              </div>
              <h1 className="mt-8 max-w-[520px] text-4xl font-semibold tracking-normal">
                Arctic Aria
              </h1>
              <p className="mt-4 max-w-[560px] text-base leading-7 text-slate-300">
                Sign in to reach the daily planning workspace. The database is a
                dummy empty table for now, but the validation flow is wired like
                the first implementation target.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-slate-300">
              <div className="rounded-md border border-slate-700 p-4">
                Username and password are checked while typing and again on
                submit.
              </div>
              <div className="rounded-md border border-slate-700 p-4">
                No password values are printed in logs.
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                <LockKeyhole size={20} aria-hidden="true" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Arctic Aria</h1>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 rounded-md border border-slate-300 bg-slate-100 p-1">
              <button
                className={`h-10 rounded text-sm font-semibold transition ${
                  mode === "register"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
                type="button"
                onClick={() => switchMode("register")}
              >
                Sign up
              </button>
              <button
                className={`h-10 rounded text-sm font-semibold transition ${
                  mode === "login"
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:text-slate-950"
                }`}
                type="button"
                onClick={() => switchMode("login")}
              >
                Sign in
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold tracking-normal">
                {mode === "register" ? "Create account" : "Welcome back"}
              </h2>
            </div>

            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Username</span>
                <input
                  className={inputClass(Boolean(fieldError(activeErrors, "username")))}
                  value={
                    mode === "register"
                      ? registerInput.username
                      : loginInput.username
                  }
                  onChange={(event) =>
                    mode === "register"
                      ? updateRegister("username", event.target.value)
                      : updateLogin("username", event.target.value)
                  }
                  autoComplete="username"
                  aria-invalid={Boolean(fieldError(activeErrors, "username"))}
                />
                <span className="min-h-5 text-sm text-red-600">
                  {fieldError(activeErrors, "username")}
                </span>
              </label>

              {mode === "register" ? (
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Display name
                  </span>
                  <input
                    className={inputClass(
                      Boolean(fieldError(activeErrors, "displayName")),
                    )}
                    value={registerInput.displayName}
                    onChange={(event) =>
                      updateRegister("displayName", event.target.value)
                    }
                    autoComplete="name"
                    aria-invalid={Boolean(fieldError(activeErrors, "displayName"))}
                  />
                  <span className="min-h-5 text-sm text-red-600">
                    {fieldError(activeErrors, "displayName")}
                  </span>
                </label>
              ) : null}

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <div className="relative">
                  <input
                    className={`${inputClass(
                      Boolean(fieldError(activeErrors, "password")),
                    )} pr-11`}
                    value={
                      mode === "register"
                        ? registerInput.password
                        : loginInput.password
                    }
                    onChange={(event) =>
                      mode === "register"
                        ? updateRegister("password", event.target.value)
                        : updateLogin("password", event.target.value)
                    }
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    aria-invalid={Boolean(fieldError(activeErrors, "password"))}
                  />
                  <button
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-950"
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
                </div>
                <span className="min-h-5 text-sm text-red-600">
                  {fieldError(activeErrors, "password")}
                </span>
              </label>

              {mode === "register" ? (
                <label className="grid gap-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    Repeat password
                  </span>
                  <input
                    className={inputClass(
                      Boolean(fieldError(activeErrors, "repeatPassword")),
                    )}
                    value={registerInput.repeatPassword}
                    onChange={(event) =>
                      updateRegister("repeatPassword", event.target.value)
                    }
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    aria-invalid={Boolean(
                      fieldError(activeErrors, "repeatPassword"),
                    )}
                  />
                  <span className="min-h-5 text-sm text-red-600">
                    {fieldError(activeErrors, "repeatPassword")}
                  </span>
                </label>
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

              <button
                className="mt-1 flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                type="submit"
                disabled={submitDisabled}
              >
                {isPending
                  ? "Checking..."
                  : mode === "register"
                    ? "Sign up"
                    : "Sign in"}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>

            <button
              className="mt-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
              type="button"
              onClick={() => setAuthenticated(true)}
            >
              <UserRound size={16} aria-hidden="true" />
              Open dashboard without an account
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
