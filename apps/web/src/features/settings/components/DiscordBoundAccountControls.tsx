"use client";

// Settings Page - Discord Bound Account Controls.
import { LoaderCircle, Send, Unlink } from "lucide-react";
import { Button } from "@/components/button";
import type { SettingsMessages } from "@/messages/app-messages";
import { DiscordBoundAccountField } from "./DiscordBoundAccountField";

export function DiscordBoundAccountControls({
  accountId,
  accountIdVisible,
  action,
  darkMode,
  loading,
  messages,
  onSendTestMessage,
  onToggleAccountId,
  onUnbind,
}: {
  accountId: string;
  accountIdVisible: boolean;
  action: "bind" | "cancel" | "load" | "test" | "unbind" | null;
  darkMode: boolean;
  loading: boolean;
  messages: SettingsMessages;
  onSendTestMessage: () => void;
  onToggleAccountId: () => void;
  onUnbind: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <DiscordBoundAccountField
        accountId={accountId}
        className="flex-1 sm:max-w-sm"
        darkMode={darkMode}
        hidden={!accountIdVisible}
        hideLabel={messages.discord.hideAccountId}
        label={messages.discord.boundAccountIdLabel}
        onToggleHidden={onToggleAccountId}
        viewLabel={messages.discord.viewAccountId}
      />
      {loading ? null : (
        <>
          <Button
            darkMode={darkMode}
            disabled={action !== null}
            icon={action === "test" ? undefined : <Send size={14} aria-hidden="true" />}
            loading={action === "test"}
            loadingIcon={
              <LoaderCircle
                className="animate-spin"
                size={14}
                aria-hidden="true"
              />
            }
            size="field"
            onClick={onSendTestMessage}
          >
            {messages.discord.sendTest}
          </Button>
          <Button
            darkMode={darkMode}
            disabled={action !== null}
            icon={<Unlink size={14} aria-hidden="true" />}
            size="field"
            onClick={onUnbind}
          >
            {messages.discord.unbind}
          </Button>
        </>
      )}
    </div>
  );
}
