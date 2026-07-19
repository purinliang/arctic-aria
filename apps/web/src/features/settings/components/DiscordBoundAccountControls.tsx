"use client";

// Settings Page - Discord Bound Account Controls.
import { Eye, EyeOff, LoaderCircle, Send, Unlink } from "lucide-react";
import { Button } from "@/components/button";
import { MaskedText } from "@/components/masked-text";
import { DescriptionText } from "@/components/text";
import type { SettingsMessages } from "@/messages/app-messages";

export function DiscordBoundAccountControls({
  accountId,
  accountIdVisible,
  action,
  darkMode,
  messages,
  onSendTestMessage,
  onToggleAccountId,
  onUnbind,
}: {
  accountId: string;
  accountIdVisible: boolean;
  action: "bind" | "cancel" | "load" | "test" | "unbind" | null;
  darkMode: boolean;
  messages: SettingsMessages;
  onSendTestMessage: () => void;
  onToggleAccountId: () => void;
  onUnbind: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <DescriptionText darkMode={darkMode} className="shrink-0">
        {messages.discord.bound}
      </DescriptionText>
      <MaskedText
        className="flex-1 sm:max-w-48"
        hidden={!accountIdVisible}
        label={messages.discord.boundAccountIdLabel}
        value={accountId}
        trailing={
          <Button
            darkMode={darkMode}
            tone="ghost"
            size="icon-sm"
            aria-label={
              accountIdVisible
                ? messages.discord.hideAccountId
                : messages.discord.viewAccountId
            }
            icon={
              accountIdVisible ? (
                <EyeOff size={14} aria-hidden="true" />
              ) : (
                <Eye size={14} aria-hidden="true" />
              )
            }
            onClick={onToggleAccountId}
          />
        }
      />
      <Button
        darkMode={darkMode}
        disabled={action !== null}
        icon={action === "test" ? undefined : <Send size={14} aria-hidden="true" />}
        loading={action === "test"}
        loadingIcon={
          <LoaderCircle className="animate-spin" size={14} aria-hidden="true" />
        }
        onClick={onSendTestMessage}
      >
        {messages.discord.sendTest}
      </Button>
      <Button
        darkMode={darkMode}
        disabled={action !== null}
        icon={<Unlink size={14} aria-hidden="true" />}
        onClick={onUnbind}
      >
        {messages.discord.unbind}
      </Button>
    </div>
  );
}
