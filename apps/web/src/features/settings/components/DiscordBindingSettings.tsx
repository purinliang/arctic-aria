"use client";

// Settings Page - Discord Binding Settings.
import {
  LoaderCircle,
  RefreshCw,
  Unlink,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/button";
import {
  controlGroupSurfaceClass,
  mutedTextClass,
  sectionBorderClass,
} from "@/components/color";
import { ConfirmDialog } from "@/components/dialog";
import { ListItem } from "@/components/list";
import { SupportingText } from "@/components/text";
import type { SettingsMessages } from "@/messages/app-messages";
import type { LanguagePreference } from "@/messages/languages";
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
type DiscordAction = "cancel" | "connect" | "refresh" | "unbind";

export function DiscordBindingSettings({
  darkMode,
  languagePreference,
  messages,
  showErrorNotification,
  showSuccessNotification,
}: {
  darkMode: boolean;
  languagePreference: LanguagePreference;
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
  const discordDisplayName = useMemo(() => {
    if (!discordBinding) {
      return null;
    }

    return discordBinding.discordUsername || discordBinding.discordUserId;
  }, [discordBinding]);
  const discordStatusText = discordLoading
    ? messages.discord.checking
    : discordDisplayName
      ? messages.discord.connectedAs(discordDisplayName)
      : messages.discord.notConnected;
  const bindingCodeExpiry = pendingBindingCode
    ? formatBindingCodeExpiry(pendingBindingCode.expiresAt, languagePreference)
    : null;

  const refreshDiscordBinding = useCallback(
    async (showFailure = true) => {
      setDiscordLoading(true);
      setDiscordAction("refresh");

      try {
        const result = await getDiscordBinding();

        if (result.ok) {
          setDiscordBinding(result.binding);
          return;
        }

        if (showFailure) {
          showErrorNotification(
            bindingResultMessage(result.code, result.message, messages),
            messages.discord.notifications.loadFailed,
          );
        }
      } catch {
        if (showFailure) {
          showErrorNotification(
            messages.discord.results.settings_discord_binding_unavailable,
            messages.discord.notifications.loadFailed,
          );
        }
      } finally {
        setDiscordLoading(false);
        setDiscordAction(null);
      }
    },
    [messages, showErrorNotification],
  );

  useEffect(() => {
    void refreshDiscordBinding(false);
  }, [refreshDiscordBinding]);

  async function handleCreateCode() {
    setDiscordAction("connect");

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
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {messages.discord.label}
              </p>
              <SupportingText darkMode={darkMode}>
                {discordStatusText}
              </SupportingText>
            </div>
            <RefreshButton
              darkMode={darkMode}
              loading={discordAction === "refresh"}
              label={messages.discord.refresh}
              onClick={() => {
                setPendingBindingCode(null);
                void refreshDiscordBinding();
              }}
            />
          </div>
          {pendingBindingCode ? (
            <BindingCodeBox
              darkMode={darkMode}
              code={pendingBindingCode.value}
              expiresAt={bindingCodeExpiry}
              messages={messages}
            />
          ) : null}
          <div
            className={`mt-3 flex flex-wrap gap-2 border-t pt-3 ${sectionBorderClass(darkMode)}`}
          >
            <ConnectButton
              darkMode={darkMode}
              loading={discordAction === "connect"}
              label={
                pendingBindingCode
                  ? messages.discord.regenerate
                  : discordBinding
                    ? messages.discord.reconnect
                    : messages.discord.connect
              }
              onClick={handleCreateCode}
            />
            {pendingBindingCode ? (
              <Button
                darkMode={darkMode}
                disabled={discordAction !== null}
                onClick={handleCancelCode}
              >
                {messages.discord.cancel}
              </Button>
            ) : null}
            {discordBinding ? (
              <Button
                darkMode={darkMode}
                disabled={discordAction !== null}
                icon={<Unlink size={14} aria-hidden="true" />}
                onClick={() => setConfirmUnbindOpen(true)}
              >
                {messages.discord.unbind}
              </Button>
            ) : null}
          </div>
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

function RefreshButton({
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
      tone="ghost"
      size="icon-sm"
      aria-label={label}
      loading={loading}
      icon={<RefreshCw size={15} aria-hidden="true" />}
      loadingIcon={
        <LoaderCircle className="animate-spin" size={15} aria-hidden="true" />
      }
      onClick={onClick}
    />
  );
}

function ConnectButton({
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
      loading={loading}
      icon={
        loading ? undefined : <WalletCards size={14} aria-hidden="true" />
      }
      loadingIcon={
        <LoaderCircle className="animate-spin" size={14} aria-hidden="true" />
      }
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function BindingCodeBox({
  code,
  darkMode,
  expiresAt,
  messages,
}: {
  code: string;
  darkMode: boolean;
  expiresAt: string | null;
  messages: SettingsMessages;
}) {
  return (
    <div
      className={`mt-3 rounded-md border px-3 py-3 ${controlGroupSurfaceClass(darkMode)}`}
    >
      <p className="text-sm font-semibold tracking-[0.08em]">{code}</p>
      <p className={`mt-2 text-xs leading-5 ${mutedTextClass(darkMode)}`}>
        {messages.discord.bindInstruction}
      </p>
      {expiresAt ? (
        <p className={`text-xs leading-5 ${mutedTextClass(darkMode)}`}>
          {messages.discord.expiresAt(expiresAt)}
        </p>
      ) : null}
    </div>
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

function formatBindingCodeExpiry(
  value: string,
  languagePreference: LanguagePreference,
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString(
    languagePreference === "zh-CN" ? "zh-CN" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}
