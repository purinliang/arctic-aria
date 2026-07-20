"use client";

// Auth Gate.
import { useEffect, useRef, useState, useTransition } from "react";
import { AppShell } from "@/app-shell/AppShell";
import { useAppPreferences } from "@/app-shell/app-preferences";
import { defaultDatabaseVersionStatus } from "@/components/app-metadata";
import { NotificationStack, useNotifications } from "@/components/notification";
import { useDocumentLanguage, useDocumentTheme } from "@/components/theme";
import { localizedActionMessage } from "@/messages/action-result";
import { getAppMessages } from "@/messages/app-messages";
import {
  getUserPreferences,
  saveUserPreferences,
} from "@/features/settings/actions";
import {
  normalizeUserPreferences,
  type UserPreferences,
} from "@/features/settings/preferences";
import {
  getCurrentUser,
  getPublicVersionStatus,
  logoutUser,
} from "../actions";
import { emptyLogin, emptyRegister } from "../auth-form-defaults";
import { shouldIgnoreImmediateLogout } from "../auth-interaction-guards";
import { submitLogin, submitRegister } from "../auth-client";
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
import { AuthLoadingScreen } from "./AuthLoadingScreen";
import { AuthPage } from "./AuthPage";

export type AuthMode = "login" | "register";

export function AuthGate() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [registerInput, setRegisterInput] = useState<RegisterInput>(emptyRegister);
  const [loginInput, setLoginInput] = useState<LoginInput>(emptyLogin);
  const [serverErrors, setServerErrors] = useState<AuthFieldErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [versionStatus, setVersionStatus] = useState(
    defaultDatabaseVersionStatus(),
  );
  const lastSessionCreatedAt = useRef<number | null>(null);
  const preferenceRequestSequence = useRef(0);
  const [isPending, startTransition] = useTransition();
  const {
    browserDefaults,
    darkMode,
    applyUserPreferences,
    languagePreference,
    resolvedLanguage,
    themePreference,
    timeFormatPreference,
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
  useDocumentLanguage(resolvedLanguage);

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

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let active = true;

    const requestSequence = preferenceRequestSequence.current;

    getUserPreferences()
      .then((result) => {
        if (
          active &&
          result.ok &&
          preferenceRequestSequence.current === requestSequence
        ) {
          applyUserPreferences(result.preferences);
        }
      })
      .catch(() => {
        console.warn("[settings-ui]", "preferences_load_failed");
      });

    return () => {
      active = false;
    };
  }, [applyUserPreferences, currentUser]);

  if (!sessionChecked) {
    return <AuthLoadingScreen />;
  }

  if (currentUser) {
    return (
      <AppShell
        currentUser={currentUser}
        browserTimeZone={browserDefaults.timeZone}
        darkMode={darkMode}
        languagePreference={languagePreference}
        resolvedLanguage={resolvedLanguage}
        messages={messages}
        themePreference={themePreference}
        versionStatus={versionStatus}
        logoutPending={logoutPending}
        notifications={notifications}
        onLanguagePreferenceChange={(nextPreference) =>
          updateUserPreferences({ languagePreference: nextPreference })
        }
        onThemePreferenceChange={(nextPreference) =>
          updateUserPreferences({ themePreference: nextPreference })
        }
        onTimeFormatPreferenceChange={(nextPreference) =>
          updateUserPreferences({ timeFormatPreference: nextPreference })
        }
        timeFormatPreference={timeFormatPreference}
        onLogout={() => void handleLogout()}
        onNotificationDismiss={dismissNotification}
        showErrorNotification={showErrorNotification}
        showSuccessNotification={showSuccessNotification}
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

  function updateUserPreferences(input: Partial<UserPreferences>) {
    const nextPreferences = normalizeUserPreferences({
      languagePreference,
      multipleTimezonesEnabled: false,
      themePreference,
      timeFormatPreference,
      timeZonePreference: "system",
      ...input,
    });

    applyUserPreferences(nextPreferences);

    const requestSequence = ++preferenceRequestSequence.current;

    void saveUserPreferences(nextPreferences)
      .then((result) => {
        if (preferenceRequestSequence.current !== requestSequence) {
          return;
        }

        if (result.ok) {
          applyUserPreferences(result.preferences);
          return;
        }

        showErrorNotification(
          localizedActionMessage(result, messages.settings.results),
          messages.settings.notifications.preferencesSaveFailed,
        );
      })
      .catch(() => {
        if (preferenceRequestSequence.current !== requestSequence) {
          return;
        }

        showErrorNotification(
          messages.settings.results.settings_preferences_save_failed,
          messages.settings.notifications.preferencesSaveFailed,
        );
      });
  }

  async function handleLogout() {
    if (
      logoutPending ||
      shouldIgnoreImmediateLogout({
        lastSessionCreatedAt: lastSessionCreatedAt.current,
        now: Date.now(),
      })
    ) {
      return;
    }

    setLogoutPending(true);

    try {
      await logoutUser();
      showSuccessNotification(
        messages.auth.notifications.signedOutMessage,
        messages.auth.notifications.signedOutTitle,
      );
      setMode("login");
      setLoginInput(emptyLogin);
      setRegisterInput(emptyRegister);
      resetSubmitState(true);
      replaceBrowserPath("/");
      setCurrentUser(null);
    } catch {
      showErrorNotification(messages.notifications.actionFailed);
    } finally {
      setLogoutPending(false);
    }
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
          ? await submitRegister(registerInput)
          : await submitLogin(loginInput);

      if (!result.ok) {
        setServerErrors(result.fieldErrors ?? {});
        showErrorNotification(
          localizedActionMessage(result, messages.auth.results),
          mode === "register"
            ? messages.auth.notifications.signUpFailed
            : messages.auth.notifications.signInFailed,
        );
        return;
      }

      showSuccessNotification(
        localizedActionMessage(result, messages.auth.results),
        mode === "register"
          ? messages.auth.notifications.accountCreated
          : messages.auth.notifications.signedIn,
      );

      lastSessionCreatedAt.current = Date.now();
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
        disabled={isPending}
        pending={isPending}
        submitAttempted={submitAttempted}
        onModeChange={switchMode}
        onRegisterChange={updateRegister}
        onLoginChange={updateLogin}
        onSubmit={handleSubmit}
        onGoogleLogin={showGooglePlaceholder}
        onPasswordReset={showPasswordResetPlaceholder}
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

function replaceBrowserPath(path: string) {
  if (typeof window === "undefined" || window.location.pathname === path) {
    return;
  }

  window.history.replaceState({ arcticAriaPath: path }, "", path);
}
