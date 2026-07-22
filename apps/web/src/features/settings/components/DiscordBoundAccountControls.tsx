"use client";

// Settings Page - Discord Bound Account Controls.
import { Eye, EyeOff, LoaderCircle, Send, Unlink } from "lucide-react";
import { Button } from "@/components/button";
import { PasswordInput } from "@/components/forms/input-field";
import { LabelText } from "@/components/text";
import type { SettingsMessages } from "@/messages/app-messages";
import { DiscordBindingRow } from "./DiscordBindingRow";

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
    <div className="grid gap-1.5">
      <LabelText darkMode={darkMode}>{messages.discord.bound}</LabelText>
      <DiscordBindingRow>
        <span className="w-full min-w-[min(100%,18rem)] flex-1 sm:max-w-[26rem]">
          <PasswordInput
            darkMode={darkMode}
            aria-label={messages.discord.boundAccountIdLabel}
            className="font-mono tracking-[0.04em]"
            disabled
            visible={accountIdVisible}
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
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Button
            darkMode={darkMode}
            disabled={action !== null}
            icon={
              action === "test" ? undefined : <Send size={14} aria-hidden="true" />
            }
            loading={action === "test"}
            loadingIcon={
              <LoaderCircle className="animate-spin" size={14} aria-hidden="true" />
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
        </span>
      </DiscordBindingRow>
    </div>
  );
}
