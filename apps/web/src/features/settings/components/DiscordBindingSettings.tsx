"use client";

// Settings Page - Discord Binding Settings.
import { Link, LoaderCircle, Unlink } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/dialog";
import { ListItem } from "@/components/list";
import { DescriptionText } from "@/components/text";
import type { SettingsMessages } from "@/messages/app-messages";
import {
  readDiscordBindingCache,
  writeDiscordBindingCache,
} from "../discord-binding-cache";
import { DiscordBoundAccountControls } from "./DiscordBoundAccountControls";
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
  showErrorNotification,
  showSuccessNotification,
}: {
  currentUserId: string;
  darkMode: boolean;
  messages: SettingsMessages;
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
  const discordStatusText = getDiscordStatusText({
    bindingStatusFailed,
    discordBinding,
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
          activeShowErrorNotification(
            bindingResultMessage(result.code, result.message, activeMessages),
            activeMessages.discord.notifications.loadFailed,
          );
        }

        return false;
      } catch {
        setBindingStatusFailed(true);

        if (showFailure) {
          activeShowErrorNotification(
            activeMessages.discord.results.settings_discord_binding_unavailable,
            activeMessages.discord.notifications.loadFailed,
          );
        }

        return false;
      } finally {
        setDiscordLoading(false);
        setDiscordAction(null);
      }
    },
    [currentUserId],
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
        showErrorNotification(
          bindingResultMessage(result.code, result.message, messages),
          messages.discord.notifications.codeCreateFailed,
        );
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
      showErrorNotification(
        messages.discord.results.settings_discord_code_create_failed,
        messages.discord.notifications.codeCreateFailed,
      );
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
        showErrorNotification(
          bindingResultMessage(result.code, result.message, messages),
          messages.discord.notifications.codeCancelFailed,
        );
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
      showErrorNotification(
        messages.discord.results.settings_discord_code_cancel_failed,
        messages.discord.notifications.codeCancelFailed,
      );
    } finally {
      setDiscordAction(null);
    }
  }

  async function handleUnbind() {
    setDiscordAction("unbind");

    try {
      const result = await unbindDiscordAccount();

      if (!result.ok) {
        showErrorNotification(
          bindingResultMessage(result.code, result.message, messages),
          messages.discord.notifications.unbindFailed,
        );
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
      showErrorNotification(
        messages.discord.results.settings_discord_unbind_failed,
        messages.discord.notifications.unbindFailed,
      );
    } finally {
      setDiscordAction(null);
    }
  }

  async function handleSendTestMessage() {
    setDiscordAction("test");

    try {
      const result = await sendDiscordTestMessage();

      if (!result.ok) {
        showErrorNotification(
          bindingResultMessage(result.code, result.message, messages),
          messages.discord.notifications.testFailed,
        );
        return;
      }

      showSuccessNotification(
        bindingResultMessage(result.code, undefined, messages),
        messages.discord.notifications.testSent,
      );
    } catch {
      showErrorNotification(
        messages.discord.results.settings_discord_test_delivery_failed,
        messages.discord.notifications.testFailed,
      );
    } finally {
      setDiscordAction(null);
    }
  }

  return (
    <>
      <ListItem darkMode={darkMode} className="items-start">
        <div className="min-w-0 flex-1">
          {discordBinding ? (
            <DiscordBoundAccountControls
              accountId={discordBinding.discordUserId}
              accountIdVisible={accountIdVisible}
              action={discordAction}
              darkMode={darkMode}
              messages={messages}
              onSendTestMessage={handleSendTestMessage}
              onToggleAccountId={() =>
                setAccountIdVisible((visible) => !visible)
              }
              onUnbind={() => setConfirmUnbindOpen(true)}
            />
          ) : (
            !pendingBindingCode ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <DescriptionText darkMode={darkMode} className="shrink-0">
                  {discordStatusText}
                </DescriptionText>
                {discordLoading ? null : bindingStatusFailed ? (
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
                )}
              </div>
            ) : null
          )}
          {pendingBindingCode ? (
            <DiscordBindingCodeStatus
              action={discordAction === "test" ? null : discordAction}
              darkMode={darkMode}
              code={pendingBindingCode.value}
              expiresAt={pendingBindingCode.expiresAt}
              messages={messages}
              onCancel={handleCancelCode}
              onCheckAgain={handleCheckAgain}
            />
          ) : null}
        </div>
      </ListItem>
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
}: {
  bindingStatusFailed: boolean;
  discordBinding: DiscordBindingView | null;
  discordLoading: boolean;
  messages: SettingsMessages;
}) {
  if (discordLoading) {
    return messages.discord.checking;
  }

  if (bindingStatusFailed) {
    return messages.discord.checkFailed;
  }

  if (discordBinding) {
    return messages.discord.bound;
  }

  return messages.discord.notConnected;
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
