"use client";

// Auth Gate.
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { AppShell } from "@/app-shell/AppShell";
import {
  notifyActionFailure,
  showActionTransportFailure,
} from "@/app-shell/action-notifications";
import {
  hasRecentLocalPreferenceCache,
  mergeUserPreferenceUpdate,
  useAppPreferences,
} from "@/app-shell/app-preferences";
import { defaultDatabaseVersionStatus } from "@/components/app-metadata";
import { NotificationStack, useNotifications } from "@/components/notification";
import { useDocumentLanguage, useDocumentTheme } from "@/components/theme";
import { localizedActionMessage } from "@/messages/action-result";
import { getAppMessages } from "@/messages/app-messages";
import {
  getUserPreferences,
  saveResolvedTimeZone,
  saveUserPreferences,
} from "@/features/settings/actions";
import {
  normalizeUserPreferences,
  type UserPreferences,
} from "@/features/settings/preferences";
import { readResolvedTimeZone } from "@/features/settings/time-zones";
import {
  getCurrentUser,
  getPublicVersionStatus,
  logoutUser,
} from "../actions";
import { emptyLogin, emptyRegister } from "../auth-form-defaults";
import {
  shouldIgnoreImmediateLogout,
  shouldRejectFrequentOperation,
} from "../auth-interaction-guards";
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
  const lastPreferenceOperationAt = useRef<
    Partial<Record<keyof UserPreferences, number>>
  >({});
  const pendingPreferenceOpenApproval = useRef<
    Partial<Record<keyof UserPreferences, number>>
  >({});
  const preferenceRequestSequence = useRef(0);
  const [isPending, startTransition] = useTransition();
  const {
    browserDefaults,
    darkMode,
    applyUserPreferences,
    languagePreference,
    resolvedLanguage,
    resolvedTimeZone,
    themePreference,
    timeFormatPreference,
  } = useAppPreferences();
  const currentPreferences = normalizeUserPreferences({
    languagePreference,
    multipleTimezonesEnabled: false,
    resolvedTimeZone: null,
    themePreference,
    timeFormatPreference,
    timeZonePreference: "system",
  });
  const latestPreferencesRef = useRef<UserPreferences>(currentPreferences);
  const applyPreferencesLocally = useCallback(
    (preferences: UserPreferences) => {
      const normalized = normalizeUserPreferences(preferences);

      latestPreferencesRef.current = normalized;
      applyUserPreferences(normalized);
    },
    [applyUserPreferences],
  );
  const syncResolvedTimeZone = useCallback(() => {
    const resolvedTimeZone = readResolvedTimeZone(browserDefaults.timeZone);

    if (
      !resolvedTimeZone ||
      latestPreferencesRef.current.resolvedTimeZone === resolvedTimeZone
    ) {
      return;
    }

    latestPreferencesRef.current = mergeUserPreferenceUpdate(
      latestPreferencesRef.current,
      { resolvedTimeZone },
    );

    void saveResolvedTimeZone({ resolvedTimeZone })
      .then((result) => {
        if (result.ok) {
          latestPreferencesRef.current = mergeUserPreferenceUpdate(
            latestPreferencesRef.current,
            { resolvedTimeZone: result.preferences.resolvedTimeZone },
          );
        }
      })
      .catch(() => {
        console.warn("[settings-ui]", "resolved_timezone_sync_failed");
      });
  }, [browserDefaults.timeZone]);
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
          preferenceRequestSequence.current === requestSequence &&
          !hasRecentLocalPreferenceCache()
        ) {
          applyPreferencesLocally(result.preferences);
        }
      })
      .catch(() => {
        console.warn("[settings-ui]", "preferences_load_failed");
      })
      .finally(() => {
        if (active) {
          syncResolvedTimeZone();
        }
      });

    return () => {
      active = false;
    };
  }, [applyPreferencesLocally, currentUser, syncResolvedTimeZone]);

  if (!sessionChecked) {
    return <AuthLoadingScreen />;
  }

  if (currentUser) {
    return (
      <AppShell
        currentUser={currentUser}
        darkMode={darkMode}
        languagePreference={languagePreference}
        resolvedTimeZone={resolvedTimeZone}
        messages={messages}
        themePreference={themePreference}
        versionStatus={versionStatus}
        logoutPending={logoutPending}
        notifications={notifications}
        onLanguagePreferenceChange={(nextPreference) =>
          updateUserPreferences({ languagePreference: nextPreference })
        }
        onPreferenceOpenAttempt={canOpenUserPreferenceInput}
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
        showInfoNotification={showInfoNotification}
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
    const now = currentTimeMs();
    const operationKeys = Object.keys(input) as Array<keyof UserPreferences>;
    const uncheckedOperationKeys = operationKeys.filter(
      (key) => pendingPreferenceOpenApproval.current[key] === undefined,
    );

    if (!canStartUserPreferenceOperation(uncheckedOperationKeys, now)) {
      return;
    }

    markUserPreferenceOperations(uncheckedOperationKeys, now);
    clearPreferenceOpenApprovals(operationKeys);

    const nextPreferences = mergeUserPreferenceUpdate(
      latestPreferencesRef.current,
      input,
    );

    applyPreferencesLocally(nextPreferences);

    const requestSequence = ++preferenceRequestSequence.current;

    void saveUserPreferences(nextPreferences)
      .then((result) => {
        if (preferenceRequestSequence.current !== requestSequence) {
          return;
        }

        if (result.ok) {
          applyPreferencesLocally(result.preferences);
          return;
        }

        notifyActionFailure({
          result,
          resultMessages: messages.settings.results,
          fallbackTitle: messages.settings.notifications.preferencesSaveFailed,
          notificationMessages: messages.notifications,
          showErrorNotification,
        });
      })
      .catch(() => {
        if (preferenceRequestSequence.current !== requestSequence) {
          return;
        }

        showActionTransportFailure({
          category: "server",
          messages: messages.notifications,
          showErrorNotification,
        });
      });
  }

  function canOpenUserPreferenceInput(preference: keyof UserPreferences) {
    const now = currentTimeMs();

    if (!canStartUserPreferenceOperation([preference], now)) {
      return false;
    }

    markUserPreferenceOperations([preference], now);
    pendingPreferenceOpenApproval.current = {
      ...pendingPreferenceOpenApproval.current,
      [preference]: now,
    };
    return true;
  }

  function canStartUserPreferenceOperation(
    preferences: Array<keyof UserPreferences>,
    now: number,
  ) {
    const shouldReject = preferences.some((preference) =>
      shouldRejectFrequentOperation({
        lastOperationAt: lastPreferenceOperationAt.current[preference] ?? null,
        now,
      }),
    );

    if (!shouldReject) {
      return true;
    }

    showInfoNotification(
      messages.notifications.operationTooFrequentMessage,
      messages.notifications.operationTooFrequentTitle,
    );
    return false;
  }

  function markUserPreferenceOperations(
    preferences: Array<keyof UserPreferences>,
    now: number,
  ) {
    const next = { ...lastPreferenceOperationAt.current };

    for (const preference of preferences) {
      next[preference] = now;
    }

    lastPreferenceOperationAt.current = next;
  }

  function clearPreferenceOpenApprovals(
    preferences: Array<keyof UserPreferences>,
  ) {
    const next = { ...pendingPreferenceOpenApproval.current };

    for (const preference of preferences) {
      delete next[preference];
    }

    pendingPreferenceOpenApproval.current = next;
  }

  async function handleLogout() {
    if (logoutPending) {
      return;
    }

    if (
      shouldIgnoreImmediateLogout({
        lastSessionCreatedAt: lastSessionCreatedAt.current,
        now: currentTimeMs(),
      })
    ) {
      showInfoNotification(
        messages.notifications.operationTooFrequentMessage,
        messages.notifications.operationTooFrequentTitle,
      );
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
      showActionTransportFailure({
        category: "server",
        messages: messages.notifications,
        showErrorNotification,
      });
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
        notifyActionFailure({
          result,
          resultMessages: messages.auth.results,
          fallbackTitle: mode === "register"
            ? messages.auth.notifications.signUpFailed
            : messages.auth.notifications.signInFailed,
          notificationMessages: messages.notifications,
          showErrorNotification,
        });
        return;
      }

      showSuccessNotification(
        localizedActionMessage(result, messages.auth.results),
        mode === "register"
          ? messages.auth.notifications.accountCreated
          : messages.auth.notifications.signedIn,
      );

      lastSessionCreatedAt.current = currentTimeMs();
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

function currentTimeMs() {
  return Date.now();
}
