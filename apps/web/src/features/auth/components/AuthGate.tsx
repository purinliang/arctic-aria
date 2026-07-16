"use client";

// Auth Gate.
import { LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { AppShell } from "@/app-shell/AppShell";
import { useAppPreferences } from "@/app-shell/app-preferences";
import { defaultDatabaseVersionStatus } from "@/components/app-metadata";
import { mutedTextClass } from "@/components/color";
import { NotificationStack, useNotifications } from "@/components/notification";
import { SupportingText } from "@/components/text";
import { appShellClass, useDocumentTheme } from "@/components/theme";
import { localizedActionMessage } from "@/messages/action-result";
import { getAppMessages } from "@/messages/app-messages";
import {
  getCurrentUser,
  getPublicVersionStatus,
  loginUser,
  logoutUser,
  registerUser,
} from "../actions";
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
import { AuthPage } from "./AuthPage";

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
  const [serverErrors, setServerErrors] = useState<AuthFieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [versionStatus, setVersionStatus] = useState(
    defaultDatabaseVersionStatus(),
  );
  const [isPending, startTransition] = useTransition();
  const {
    darkMode,
    languagePreference,
    resolvedLanguage,
    setLanguagePreference,
    setThemePreference,
    themePreference,
  } = useAppPreferences();
  const messages = getAppMessages(resolvedLanguage);
  const {
    notifications,
    dismissNotification,
    showErrorNotification,
    showInfoNotification,
    showSuccessNotification,
  } = useNotifications(messages.notifications);

  useDocumentTheme(darkMode);

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

  useEffect(() => {
    let active = true;

    getPublicVersionStatus()
      .then((status) => {
        if (active) {
          setVersionStatus(status);
        }
      })
      .catch(() => {
        if (active) {
          setVersionStatus((current) => ({
            ...current,
            actualDatabaseVersionText: messages.versionStatus.unavailable,
            aligned: false,
            message: messages.versionStatus.databaseUnavailable,
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [messages.versionStatus.databaseUnavailable, messages.versionStatus.unavailable]);

  if (!sessionChecked) {
    return (
      <main
        className={`grid min-h-screen place-items-center px-4 transition-colors ${appShellClass(darkMode)}`}
      >
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
              className={`animate-spin ${mutedTextClass(darkMode)}`}
              aria-hidden="true"
            />
            <SupportingText darkMode={darkMode} className="font-medium">
              {messages.auth.loading.openingWorkspace}
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
        darkMode={darkMode}
        languagePreference={languagePreference}
        messages={messages}
        themePreference={themePreference}
        versionStatus={versionStatus}
        logoutPending={isPending}
        notifications={notifications}
        onLanguagePreferenceChange={setLanguagePreference}
        onThemePreferenceChange={setThemePreference}
        onLogout={() => {
          startTransition(async () => {
            await logoutUser();
            showSuccessNotification(
              messages.auth.notifications.signedOutMessage,
              messages.auth.notifications.signedOutTitle,
            );
            setCurrentUser(null);
            resetSubmitState(true);
          });
        }}
        onNotificationDismiss={dismissNotification}
        showErrorNotification={showErrorNotification}
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
      showErrorNotification(
        messages.auth.notifications.checkFormMessage,
        messages.auth.notifications.checkFormTitle,
      );
      return;
    }

    startTransition(async () => {
      const result =
        mode === "register"
          ? await registerUser(registerInput)
          : await loginUser(loginInput);

      if (!result.ok) {
        setServerErrors(result.fieldErrors ?? {});
        showErrorNotification(
          localizedActionMessage(result, messages.auth.results),
          mode === "register"
            ? messages.auth.notifications.signUpFailed
            : messages.auth.notifications.signInFailed,
        );
        console.warn("[auth-ui]", `${mode}_failed`, {
          fields: result.fieldErrors ? Object.keys(result.fieldErrors) : [],
        });
        return;
      }

      showSuccessNotification(
        localizedActionMessage(result, messages.auth.results),
        mode === "register"
          ? messages.auth.notifications.accountCreated
          : messages.auth.notifications.signedIn,
      );
      console.info("[auth-ui]", `${mode}_success`, {
        displayName: result.displayName,
      });

      setCurrentUser(result.user);
    });
  }

  function showGooglePlaceholder() {
    showInfoNotification(
      messages.auth.notifications.googleMessage,
      messages.auth.notifications.googleTitle,
    );
  }

  function showPasswordResetPlaceholder() {
    showInfoNotification(
      messages.auth.notifications.passwordResetMessage,
      messages.auth.notifications.passwordResetTitle,
    );
  }

  return (
    <>
      <AuthPage
        darkMode={darkMode}
        messages={messages.auth}
        mode={mode}
        registerInput={registerInput}
        loginInput={loginInput}
        errors={activeErrors}
        disabled={isPending || hasAuthErrors(activeErrors)}
        pending={isPending}
        submitAttempted={submitAttempted}
        onModeChange={switchMode}
        onRegisterChange={updateRegister}
        onLoginChange={updateLogin}
        onSubmit={handleSubmit}
        onGoogleLogin={showGooglePlaceholder}
        onPasswordReset={showPasswordResetPlaceholder}
        onThemeToggle={() => setThemePreference(darkMode ? "light" : "dark")}
        versionMessages={messages.versionStatus}
        versionStatus={versionStatus}
      />
      <NotificationStack
        notifications={notifications}
        darkMode={darkMode}
        messages={messages.notifications}
        onDismiss={dismissNotification}
      />
    </>
  );
}
