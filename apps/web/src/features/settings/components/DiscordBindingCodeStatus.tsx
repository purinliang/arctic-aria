"use client";

// Settings Page - Discord Binding Code Status.
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import {
  controlGroupSurfaceClass,
  mutedTextClass,
  sectionBorderClass,
} from "@/components/color";
import type { SettingsMessages } from "@/messages/app-messages";

export function DiscordBindingCodeStatus({
  action,
  code,
  darkMode,
  expiresAt,
  messages,
  onCancel,
  onCheckAgain,
}: {
  action: "bind" | "cancel" | "load" | "unbind" | null;
  code: string;
  darkMode: boolean;
  expiresAt: string;
  messages: SettingsMessages;
  onCancel: () => void;
  onCheckAgain: () => void;
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
    <div
      className={`mt-3 rounded-md border px-3 py-3 ${controlGroupSurfaceClass(darkMode)}`}
    >
      <p className="text-sm font-semibold tracking-[0.08em]">{code}</p>
      <p className={`mt-2 text-xs leading-5 ${mutedTextClass(darkMode)}`}>
        {messages.discord.bindInstruction}
      </p>
      {expired ? (
        <p className={`text-xs leading-5 ${versionMismatchClass(darkMode)}`}>
          {messages.discord.expired}
        </p>
      ) : remainingText ? (
        <p className={`text-xs leading-5 ${mutedTextClass(darkMode)}`}>
          {remainingText}
        </p>
      ) : null}
      <div
        className={`mt-3 flex flex-wrap gap-2 border-t pt-3 ${sectionBorderClass(darkMode)}`}
      >
        <Button
          darkMode={darkMode}
          disabled={action !== null && action !== "load"}
          loading={action === "load"}
          onClick={onCheckAgain}
        >
          {messages.discord.checkAgain}
        </Button>
        <Button
          darkMode={darkMode}
          disabled={action !== null && action !== "cancel"}
          loading={action === "cancel"}
          onClick={onCancel}
        >
          {messages.discord.cancel}
        </Button>
      </div>
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
