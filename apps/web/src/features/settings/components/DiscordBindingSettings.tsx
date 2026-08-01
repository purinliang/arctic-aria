"use client";

// Settings Page - Discord Binding Settings.
import { Link, LoaderCircle, MessageCircle, Unlink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  notifyActionFailure,
  showActionTransportFailure,
} from "@/app-shell/action-notifications";
import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/dialog";
import {
  SettingsControlRow,
  SettingsControlValue,
} from "@/components/settings-control-row";
import type {
  NotificationMessages,
  SettingsMessages,
} from "@/messages/app-messages";
import {
  readDiscordBindingCache,
  writeDiscordBindingCache,
} from "../discord-binding-cache";
import { DiscordBindingCodeStatus } from "./DiscordBindingCodeStatus";
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
  const [cacheReady, setCacheReady] = useState(initialCache !== null);
  const [discordAction, setDiscordAction] = useState<DiscordAction | null>(null);
  const [confirmUnbindOpen, setConfirmUnbindOpen] = useState(false);
  const [bindingStatusFailed, setBindingStatusFailed] = useState(false);
  const cacheReadyRef = useRef(cacheReady);
  const localActionVersionRef = useRef(0);
  const messagesRef = useRef(messages);
  const pendingBindingCodeRef = useRef(pendingBindingCode);
  const showErrorNotificationRef = useRef(showErrorNotification);
  const discordStatusText = getDiscordStatusText({
    bindingStatusFailed,
    discordBinding,
    discordLoading,
    messages,
    pendingBindingCode,
  });

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    cacheReadyRef.current = cacheReady;
  }, [cacheReady]);

  useEffect(() => {
    pendingBindingCodeRef.current = pendingBindingCode;
  }, [pendingBindingCode]);

  useEffect(() => {
    showErrorNotificationRef.current = showErrorNotification;
  }, [showErrorNotification]);

  const refreshDiscordBinding = useCallback(
    async (
      showFailure = true,
      {
        showLoading = true,
      }: {
        showLoading?: boolean;
      } = {},
    ) => {
      const activeMessages = messagesRef.current;
      const activeShowErrorNotification = showErrorNotificationRef.current;
      const refreshLocalActionVersion = localActionVersionRef.current;

      if (showLoading) {
        setDiscordLoading(true);
        setDiscordAction("load");
      }

      try {
        const result = await getDiscordBinding();

        if (
          !showLoading &&
          refreshLocalActionVersion !== localActionVersionRef.current
        ) {
          return false;
        }

        if (result.ok) {
          const nextPendingBindingCode = result.binding
            ? null
            : pendingBindingCodeRef.current;

          setDiscordBinding(result.binding);
          setPendingBindingCode(nextPendingBindingCode);
          setBindingStatusFailed(false);
          setCacheReady(true);
          writeDiscordBindingCache(currentUserId, {
            binding: result.binding,
            pendingBindingCode: nextPendingBindingCode,
          });

          return true;
        }

        if (showFailure || !cacheReadyRef.current) {
          setBindingStatusFailed(true);
        }

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
        if (showFailure || !cacheReadyRef.current) {
          setBindingStatusFailed(true);
        }

        if (showFailure) {
          showActionTransportFailure({
            category: "server",
            messages: notificationMessages,
            showErrorNotification: activeShowErrorNotification,
          });
        }

        return false;
      } finally {
        if (showLoading) {
          setDiscordLoading(false);
          setDiscordAction(null);
        }
      }
    },
    [currentUserId, notificationMessages],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshDiscordBinding(false, { showLoading: !initialCache });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [initialCache, refreshDiscordBinding]);

  async function handleCreateCode() {
    localActionVersionRef.current += 1;
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
    localActionVersionRef.current += 1;
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
    localActionVersionRef.current += 1;
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
      <SettingsControlRow
        darkMode={darkMode}
        title={messages.discord.connectionStatusTitle}
        support={messages.discord.connectionStatusDescription}
        control={
          <SettingsControlValue className="tabular-nums">
            {discordStatusText}
          </SettingsControlValue>
        }
      />
      {discordLoading ? null : bindingStatusFailed ? (
        <SettingsControlRow
          darkMode={darkMode}
          title={messages.discord.refreshStatusTitle}
          support={messages.discord.refreshStatusDescription}
          control={
            <CheckAgainButton
              darkMode={darkMode}
              loading={discordAction === "load"}
              label={messages.discord.checkAgain}
              onClick={handleCheckAgain}
            />
          }
        />
      ) : discordBinding ? (
        <>
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
                    <MessageCircle size={14} aria-hidden="true" />
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
          title={messages.discord.connectTitle}
          support={messages.discord.connectDescription}
          control={
            <ConnectButton
              darkMode={darkMode}
              disabled={discordLoading}
              loading={discordAction === "bind"}
              label={messages.discord.connect}
              onClick={handleCreateCode}
            />
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
          showErrorNotification={showErrorNotification}
          showSuccessNotification={showSuccessNotification}
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

function getDiscordStatusText({
  bindingStatusFailed,
  discordBinding,
  discordLoading,
  messages,
  pendingBindingCode,
}: {
  bindingStatusFailed: boolean;
  discordBinding: DiscordBindingView | null;
  discordLoading: boolean;
  messages: SettingsMessages;
  pendingBindingCode: PendingBindingCode | null;
}) {
  if (discordLoading) {
    return messages.discord.connectionChecking;
  }

  if (bindingStatusFailed) {
    return messages.discord.connectionUnknown;
  }

  if (discordBinding) {
    return messages.discord.connectionConnected;
  }

  if (pendingBindingCode) {
    return messages.discord.connectionConnecting;
  }

  return messages.discord.connectionDisconnected;
}

function ConnectButton({
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
