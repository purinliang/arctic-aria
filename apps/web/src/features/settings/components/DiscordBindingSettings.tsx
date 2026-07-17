"use client";

// Settings Page - Discord Binding Settings.
import { Link, LoaderCircle, Unlink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/dialog";
import { ListItem } from "@/components/list";
import { DescriptionText } from "@/components/text";
import type { SettingsMessages } from "@/messages/app-messages";
import { DiscordBoundAccountField } from "./DiscordBoundAccountField";
import { DiscordBindingCodeStatus } from "./DiscordBindingCodeStatus";
import {
  cancelDiscordBindingCode,
  createDiscordBindingCode,
  getDiscordBinding,
  unbindDiscordAccount,
} from "../actions";

type DiscordBindingView = {
  discordUserId: string;
  discordUsername: string | null;
};

type PendingBindingCode = { value: string; expiresAt: string };
type DiscordAction = "bind" | "cancel" | "load" | "unbind";

export function DiscordBindingSettings({
  darkMode,
  messages,
  showErrorNotification,
  showSuccessNotification,
}: {
  darkMode: boolean;
  messages: SettingsMessages;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const [discordBinding, setDiscordBinding] =
    useState<DiscordBindingView | null>(null);
  const [pendingBindingCode, setPendingBindingCode] =
    useState<PendingBindingCode | null>(null);
  const [discordLoading, setDiscordLoading] = useState(true);
  const [discordAction, setDiscordAction] = useState<DiscordAction | null>(null);
  const [confirmUnbindOpen, setConfirmUnbindOpen] = useState(false);
  const [accountIdVisible, setAccountIdVisible] = useState(false);
  const [bindingStatusFailed, setBindingStatusFailed] = useState(false);
  const discordStatusText = getDiscordStatusText({
    bindingStatusFailed,
    discordBinding,
    discordLoading,
    messages,
  });

  const refreshDiscordBinding = useCallback(
    async (showFailure = true) => {
      setDiscordLoading(true);
      setDiscordAction("load");

      try {
        const result = await getDiscordBinding();

        if (result.ok) {
          setDiscordBinding(result.binding);
          setBindingStatusFailed(false);

          if (result.binding) {
            setPendingBindingCode(null);
          }

          return true;
        }

        setBindingStatusFailed(true);

        if (showFailure) {
          showErrorNotification(
            bindingResultMessage(result.code, result.message, messages),
            messages.discord.notifications.loadFailed,
          );
        }

        return false;
      } catch {
        setBindingStatusFailed(true);

        if (showFailure) {
          showErrorNotification(
            messages.discord.results.settings_discord_binding_unavailable,
            messages.discord.notifications.loadFailed,
          );
        }

        return false;
      } finally {
        setDiscordLoading(false);
        setDiscordAction(null);
      }
    },
    [messages, showErrorNotification],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshDiscordBinding(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshDiscordBinding]);

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

  return (
    <>
      <ListItem darkMode={darkMode} className="items-start">
        <div className="min-w-0 flex-1">
          {discordBinding ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <DiscordBoundAccountField
                accountId={discordBinding.discordUserId}
                className="flex-1 sm:max-w-sm"
                darkMode={darkMode}
                hidden={!accountIdVisible}
                hideLabel={messages.discord.hideAccountId}
                label={messages.discord.boundAccountIdLabel}
                onToggleHidden={() =>
                  setAccountIdVisible((visible) => !visible)
                }
                viewLabel={messages.discord.viewAccountId}
              />
              {discordLoading ? null : (
                <Button
                  darkMode={darkMode}
                  disabled={discordAction !== null}
                  icon={<Unlink size={14} aria-hidden="true" />}
                  size="field"
                  onClick={() => setConfirmUnbindOpen(true)}
                >
                  {messages.discord.unbind}
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <DescriptionText darkMode={darkMode} className="shrink-0">
                {discordStatusText}
              </DescriptionText>
              {discordLoading ? null : bindingStatusFailed && !pendingBindingCode ? (
                <CheckAgainButton
                  darkMode={darkMode}
                  loading={discordAction === "load"}
                  label={messages.discord.checkAgain}
                  onClick={handleCheckAgain}
                />
              ) : !pendingBindingCode ? (
                <BindButton
                  darkMode={darkMode}
                  disabled={discordLoading}
                  loading={discordAction === "bind"}
                  label={messages.discord.bind}
                  onClick={handleCreateCode}
                />
              ) : null}
            </div>
          )}
          {pendingBindingCode ? (
            <DiscordBindingCodeStatus
              action={discordAction}
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
      size="field"
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
      size="field"
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
