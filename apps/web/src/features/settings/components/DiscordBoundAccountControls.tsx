"use client";

// Settings Page - Discord Bound Account Controls.
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/button";
import { PasswordInput } from "@/components/forms/input-field";
import type { SettingsMessages } from "@/messages/app-messages";

export function DiscordBoundAccountControls({
  accountId,
  accountIdVisible,
  darkMode,
  messages,
  onToggleAccountId,
}: {
  accountId: string;
  accountIdVisible: boolean;
  darkMode: boolean;
  messages: SettingsMessages;
  onToggleAccountId: () => void;
}) {
  return (
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
          size="icon"
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
  );
}
