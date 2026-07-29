"use client";

// Settings Page - Discord Binding Settings.
import { Link, LoaderCircle, Send, Unlink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  notifyActionFailure,
  showActionTransportFailure,
} from "@/app-shell/action-notifications";
import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/dialog";
import type {
  NotificationMessages,
  SettingsMessages,
} from "@/messages/app-messages";
import {
  readDiscordBindingCache,
  writeDiscordBindingCache,
} from "../discord-binding-cache";
import { DiscordBoundAccountControls } from "./DiscordBoundAccountControls";
import { DiscordBindingCodeStatus } from "./DiscordBindingCodeStatus";
import { SettingsControlRow } from "./SettingsControlRow";
import {
  cancelDiscordBindingCode,
  createDiscordBindingCode,
  getDiscordBinding,
  sendDiscordTestMessage,
  unbindDiscordAccount,
} from "../actions";

type DiscordBindingView = {
  discordUserId: string;
  discordUsername: string | null;
};

type PendingBindingCode = { value: string; expiresAt: string };
type DiscordAction = "bind" | "cancel" | "load" | "test" | "unbind";

export function DiscordBindingSettings({
  currentUserId,
  darkMode,
  messages,
  notificationMessages,
  showErrorNotification,
  showSuccessNotification,
}: {
  currentUserId: string;
  darkMode: boolean;
  messages: SettingsMessages;
  notificationMessages: NotificationMessages;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const [initialCache] = useState(() => readDiscordBindingCache(currentUserId));
  const [discordBinding, setDiscordBinding] =
    useState<DiscordBindingView | null>(initialCache?.binding ?? null);
  const [pendingBindingCode, setPendingBindingCode] =
    useState<PendingBindingCode | null>(
      initialCache?.pendingBindingCode ?? null,
    );
  const [discordLoading, setDiscordLoading] = useState(!initialCache);
  const [discordAction, setDiscordAction] = useState<DiscordAction | null>(null);
  const [confirmUnbindOpen, setConfirmUnbindOpen] = useState(false);
  const [accountIdVisible, setAccountIdVisible] = useState(false);
  const [bindingStatusFailed, setBindingStatusFailed] = useState(false);
  const messagesRef = useRef(messages);
  const pendingBindingCodeRef = useRef(pendingBindingCode);
  const showErrorNotificationRef = useRef(showErrorNotification);
  const discordStatusSupport = getDiscordStatusSupport({
    bindingStatusFailed,
    discordLoading,
    messages,
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    pendingBindingCodeRef.current = pendingBindingCode;
  }, [pendingBindingCode]);

  useEffect(() => {
    showErrorNotificationRef.current = showErrorNotification;
  }, [showErrorNotification]);

  const refreshDiscordBinding = useCallback(
    async (showFailure = true) => {
      const activeMessages = messagesRef.current;
      const activeShowErrorNotification = showErrorNotificationRef.current;

      setDiscordLoading(true);
      setDiscordAction("load");

      try {
        const result = await getDiscordBinding();

        if (result.ok) {
          const nextPendingBindingCode = result.binding
            ? null
            : pendingBindingCodeRef.current;

          setDiscordBinding(result.binding);
          setPendingBindingCode(nextPendingBindingCode);
          setBindingStatusFailed(false);
          writeDiscordBindingCache(currentUserId, {
            binding: result.binding,
            pendingBindingCode: nextPendingBindingCode,
          });

          return true;
        }

        setBindingStatusFailed(true);

        if (showFailure) {
          notifyActionFailure({
            result,
            resultMessages: activeMessages.discord.results,
            fallbackTitle: activeMessages.discord.notifications.loadFailed,
            notificationMessages,
            showErrorNotification: activeShowErrorNotification,
          });
        }

        return false;
      } catch {
        setBindingStatusFailed(true);

        if (showFailure) {
          showActionTransportFailure({
            category: "server",
            messages: notificationMessages,
            showErrorNotification: activeShowErrorNotification,
          });
        }

        return false;
      } finally {
        setDiscordLoading(false);
        setDiscordAction(null);
      }
    },
    [currentUserId, notificationMessages],
  );

  useEffect(() => {
    if (initialCache) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void refreshDiscordBinding(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialCache, refreshDiscordBinding]);

  async function handleCreateCode() {
    setDiscordAction("bind");

    try {
      const result = await createDiscordBindingCode();

      if (!result.ok) {
        notifyActionFailure({
          result,
          resultMessages: messages.discord.results,
          fallbackTitle: messages.discord.notifications.codeCreateFailed,
          notificationMessages,
          showErrorNotification,
        });
        return;
      }

      setDiscordBinding(result.binding);
      setPendingBindingCode(result.bindingCode ?? null);
      writeDiscordBindingCache(currentUserId, {
        binding: result.binding,
        pendingBindingCode: result.bindingCode ?? null,
      });
      showSuccessNotification(
        bindingResultMessage(result.code, undefined, messages),
        messages.discord.notifications.codeCreated,
      );
    } catch {
      showActionTransportFailure({
        category: "server",
        messages: notificationMessages,
        showErrorNotification,
      });
    } finally {
      setDiscordAction(null);
    }
  }

  async function handleCheckAgain() {
    await refreshDiscordBinding(true);
  }

  async function handleCancelCode() {
    setDiscordAction("cancel");

    try {
      const result = await cancelDiscordBindingCode();

      if (!result.ok) {
        notifyActionFailure({
          result,
          resultMessages: messages.discord.results,
          fallbackTitle: messages.discord.notifications.codeCancelFailed,
          notificationMessages,
          showErrorNotification,
        });
        return;
      }

      setDiscordBinding(result.binding);
      setPendingBindingCode(null);
      writeDiscordBindingCache(currentUserId, {
        binding: result.binding,
        pendingBindingCode: null,
      });
      showSuccessNotification(
        bindingResultMessage(result.code, undefined, messages),
        messages.discord.notifications.codeCanceled,
      );
    } catch {
      showActionTransportFailure({
        category: "server",
        messages: notificationMessages,
        showErrorNotification,
      });
    } finally {
      setDiscordAction(null);
    }
  }

  async function handleUnbind() {
    setDiscordAction("unbind");

    try {
      const result = await unbindDiscordAccount();

      if (!result.ok) {
        notifyActionFailure({
          result,
          resultMessages: messages.discord.results,
          fallbackTitle: messages.discord.notifications.unbindFailed,
          notificationMessages,
          showErrorNotification,
        });
        return;
      }

      setConfirmUnbindOpen(false);
      setDiscordBinding(null);
      setPendingBindingCode(null);
      writeDiscordBindingCache(currentUserId, {
        binding: null,
        pendingBindingCode: null,
      });
      showSuccessNotification(
        bindingResultMessage(result.code, undefined, messages),
        messages.discord.notifications.unbound,
      );
    } catch {
      showActionTransportFailure({
        category: "server",
        messages: notificationMessages,
        showErrorNotification,
      });
    } finally {
      setDiscordAction(null);
    }
  }

  async function handleSendTestMessage() {
    setDiscordAction("test");

    try {
      const result = await sendDiscordTestMessage();

      if (!result.ok) {
        notifyActionFailure({
          result,
          resultMessages: messages.discord.results,
          fallbackTitle: messages.discord.notifications.testFailed,
          notificationMessages,
          showErrorNotification,
        });
        return;
      }

      showSuccessNotification(
        bindingResultMessage(result.code, undefined, messages),
        messages.discord.notifications.testSent,
      );
    } catch {
      showActionTransportFailure({
        category: "server",
        messages: notificationMessages,
        showErrorNotification,
      });
    } finally {
      setDiscordAction(null);
    }
  }

  return (
    <>
      {discordBinding ? (
        <>
          <SettingsControlRow
            darkMode={darkMode}
            title={messages.discord.bound}
            support={messages.discord.boundAccountDescription}
            controlWidth="field"
            control={
              <DiscordBoundAccountControls
                accountId={discordBinding.discordUserId}
                accountIdVisible={accountIdVisible}
                darkMode={darkMode}
                messages={messages}
                onToggleAccountId={() =>
                  setAccountIdVisible((visible) => !visible)
                }
              />
            }
          />
          <SettingsControlRow
            darkMode={darkMode}
            title={messages.discord.testMessageTitle}
            support={messages.discord.testMessageDescription}
            control={
              <Button
                darkMode={darkMode}
                disabled={discordAction !== null}
                icon={
                  discordAction === "test" ? undefined : (
                    <Send size={14} aria-hidden="true" />
                  )
                }
                loading={discordAction === "test"}
                loadingIcon={
                  <LoaderCircle
                    className="animate-spin"
                    size={14}
                    aria-hidden="true"
                  />
                }
                onClick={handleSendTestMessage}
              >
                {messages.discord.sendTest}
              </Button>
            }
          />
          <SettingsControlRow
            darkMode={darkMode}
            title={messages.discord.unbindTitle}
            support={messages.discord.unbindDescription}
            control={
              <Button
                darkMode={darkMode}
                disabled={discordAction !== null}
                icon={<Unlink size={14} aria-hidden="true" />}
                onClick={() => setConfirmUnbindOpen(true)}
              >
                {messages.discord.unbind}
              </Button>
            }
          />
        </>
      ) : !pendingBindingCode ? (
        <SettingsControlRow
          darkMode={darkMode}
          title={messages.discord.bindingTitle}
          support={discordStatusSupport}
          control={
            discordLoading ? (
              <CheckingButton
                darkMode={darkMode}
                label={messages.discord.checkingAction}
              />
            ) : bindingStatusFailed ? (
              <CheckAgainButton
                darkMode={darkMode}
                loading={discordAction === "load"}
                label={messages.discord.checkAgain}
                onClick={handleCheckAgain}
              />
            ) : (
              <BindButton
                darkMode={darkMode}
                disabled={discordLoading}
                loading={discordAction === "bind"}
                label={messages.discord.bind}
                onClick={handleCreateCode}
              />
            )
          }
        />
      ) : (
        <DiscordBindingCodeStatus
          action={discordAction === "test" ? null : discordAction}
          darkMode={darkMode}
          code={pendingBindingCode.value}
          expiresAt={pendingBindingCode.expiresAt}
          messages={messages}
          onCancel={handleCancelCode}
        />
      )}
      {confirmUnbindOpen ? (
        <ConfirmDialog
          darkMode={darkMode}
          pending={discordAction === "unbind"}
          title={messages.discord.confirmUnbindTitle}
          description={messages.discord.confirmUnbindDescription}
          confirmText={messages.discord.unbind}
          cancelText={messages.discord.cancel}
          closeLabel={messages.discord.closeUnbindConfirmation}
          confirmIcon={<Unlink size={14} aria-hidden="true" />}
          onCancel={() => setConfirmUnbindOpen(false)}
          onConfirm={handleUnbind}
        />
      ) : null}
    </>
  );
}

function getDiscordStatusSupport({
  bindingStatusFailed,
  discordLoading,
  messages,
}: {
  bindingStatusFailed: boolean;
  discordLoading: boolean;
  messages: SettingsMessages;
}) {
  if (discordLoading) {
    return messages.discord.checking;
  }

  if (bindingStatusFailed) {
    return messages.discord.checkFailed;
  }

  return messages.discord.notConnected;
}

function CheckingButton({
  darkMode,
  label,
}: {
  darkMode: boolean;
  label: string;
}) {
  return (
    <Button
      darkMode={darkMode}
      disabled
      loading
      loadingIcon={
        <LoaderCircle className="animate-spin" size={14} aria-hidden="true" />
      }
    >
      {label}
    </Button>
  );
}

function BindButton({
  darkMode,
  disabled,
  label,
  loading,
  onClick,
}: {
  darkMode: boolean;
  disabled: boolean;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      darkMode={darkMode}
      disabled={disabled}
      loading={loading}
      icon={loading ? undefined : <Link size={14} aria-hidden="true" />}
      loadingIcon={
        <LoaderCircle className="animate-spin" size={14} aria-hidden="true" />
      }
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function CheckAgainButton({
  darkMode,
  label,
  loading,
  onClick,
}: {
  darkMode: boolean;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      darkMode={darkMode}
      disabled={loading}
      loading={loading}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function bindingResultMessage(
  code: string,
  fallback: string | undefined,
  messages: SettingsMessages,
) {
  const results = messages.discord.results as Record<string, string>;

  return results[code] ?? fallback ?? messages.discord.genericError;
}
