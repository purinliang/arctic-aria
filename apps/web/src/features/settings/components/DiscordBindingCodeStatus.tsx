"use client";

// Settings Page - Discord Binding Code Status.
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { secondaryTextColorClass } from "@/components/color";
import type { SettingsMessages } from "@/messages/app-messages";

export function DiscordBindingCodeStatus({
  action,
  code,
  darkMode,
  expiresAt,
  messages,
  onCancel,
}: {
  action: "bind" | "cancel" | "load" | "unbind" | null;
  code: string;
  darkMode: boolean;
  expiresAt: string;
  messages: SettingsMessages;
  onCancel: () => void;
}) {
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const expired = isBindingCodeExpired(expiresAt, currentTime);
  const remainingText = formatBindingCodeRemaining(
    expiresAt,
    currentTime,
    messages,
  );

  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(Date.now());
    const timeoutId = window.setTimeout(updateCurrentTime, 0);
    const intervalId = window.setInterval(updateCurrentTime, 30_000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
      <p className={`min-w-0 max-w-full text-sm leading-6 ${secondaryTextColorClass}`}>
        <span className="inline-flex max-w-full flex-wrap items-center gap-x-1.5 gap-y-1">
          <span>{messages.discord.bindInstructionPrefix}</span>
          <code className="whitespace-nowrap rounded border border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-header-bg)] px-1.5 py-0.5 font-mono text-xs font-semibold text-[var(--aa-primary-text)]">
            /bind code:{code}
          </code>
          <span>{messages.discord.bindInstructionSuffix}</span>
          {expired ? (
            <span className={versionMismatchClass(darkMode)}>
              {messages.discord.expired}
            </span>
          ) : remainingText ? (
            <span>{remainingText}</span>
          ) : null}
        </span>
      </p>
      <Button
        darkMode={darkMode}
        disabled={action !== null && action !== "cancel"}
        loading={action === "cancel"}
        onClick={onCancel}
      >
        {messages.discord.cancel}
      </Button>
    </div>
  );
}

function formatBindingCodeRemaining(
  value: string,
  currentTime: number | null,
  messages: SettingsMessages,
) {
  if (currentTime === null) {
    return null;
  }

  const expiresAt = new Date(value).getTime();

  if (!Number.isFinite(expiresAt) || expiresAt <= currentTime) {
    return null;
  }

  return messages.discord.expiresIn(
    Math.max(1, Math.ceil((expiresAt - currentTime) / 60_000)),
  );
}

function isBindingCodeExpired(value: string, currentTime: number | null) {
  if (currentTime === null) {
    return false;
  }

  const expiresAt = new Date(value).getTime();

  return Number.isFinite(expiresAt) && expiresAt <= currentTime;
}

function versionMismatchClass(darkMode: boolean) {
  return darkMode ? "text-red-300" : "text-red-600";
}
