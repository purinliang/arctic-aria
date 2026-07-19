"use client";

// Settings Page - Discord Bound Account Controls.
import { Eye, EyeOff, LoaderCircle, Send, Unlink } from "lucide-react";
import { Button } from "@/components/button";
import { TextInput } from "@/components/forms/input-field";
import { DescriptionText } from "@/components/text";
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
    <DiscordBindingRow>
      <DescriptionText darkMode={darkMode} className="shrink-0">
        {messages.discord.bound}
      </DescriptionText>
      <span className="min-w-0 flex-1 sm:max-w-64">
        <TextInput
          darkMode={darkMode}
          aria-label={messages.discord.boundAccountIdLabel}
          className="font-mono tracking-[0.04em]"
          readOnly
          type={accountIdVisible ? "text" : "password"}
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
      <Button
        darkMode={darkMode}
        disabled={action !== null}
        icon={action === "test" ? undefined : <Send size={14} aria-hidden="true" />}
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
    </DiscordBindingRow>
  );
}
