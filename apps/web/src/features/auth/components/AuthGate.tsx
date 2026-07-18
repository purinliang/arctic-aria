"use client";

// Auth Gate.
import { LoaderCircle } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { AppShell } from "@/app-shell/AppShell";
import { useAppPreferences } from "@/app-shell/app-preferences";
import { ArcticAriaLogo } from "@/components/arctic-aria-logo";
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

const englishAuthMessages = getAppMessages("en").auth;
const simplifiedChineseAuthMessages = getAppMessages("zh-CN").auth;

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
  const [isPending, startTransition] = useTransition();
  const {
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

    getUserPreferences()
      .then((result) => {
        if (active && result.ok) {
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
    return (
      <main
        className="grid min-h-[100svh] place-items-center bg-[var(--aa-page-bg)] px-4 text-[var(--aa-primary-text)] transition-colors sm:min-h-screen"
      >
        <div
          className="grid justify-items-center gap-4 text-center"
          role="status"
          aria-live="polite"
        >
          <ArcticAriaLogo
            brandText={englishAuthMessages.brandName}
            className="aa-language-block aa-language-option-en"
          />
          <ArcticAriaLogo
            brandText={simplifiedChineseAuthMessages.brandName}
            className="aa-language-block aa-language-option-zh"
          />
          <div className="flex items-center justify-center gap-2">
            <LoaderCircle
              size={18}
              className="animate-spin text-[var(--aa-secondary-text)]"
              aria-hidden="true"
            />
            <span
              className="aa-language-inline aa-language-option-en text-xs font-medium leading-5 text-[var(--aa-secondary-text)]"
            >
              {englishAuthMessages.loading.openingWorkspace}
            </span>
            <span
              className="aa-language-inline aa-language-option-zh text-xs font-medium leading-5 text-[var(--aa-secondary-text)]"
            >
              {simplifiedChineseAuthMessages.loading.openingWorkspace}
            </span>
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
      themePreference,
      timeFormatPreference,
      ...input,
    });

    applyUserPreferences(nextPreferences);

    void saveUserPreferences(nextPreferences)
      .then((result) => {
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
        showErrorNotification(
          messages.settings.results.settings_preferences_save_failed,
          messages.settings.notifications.preferencesSaveFailed,
        );
      });
  }

  async function handleLogout() {
    if (logoutPending) {
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
