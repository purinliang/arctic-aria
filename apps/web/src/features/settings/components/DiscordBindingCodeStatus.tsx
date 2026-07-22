"use client";

// Settings Page - Discord Binding Code Status.
import { useEffect, useState } from "react";
import { Button } from "@/components/button";
import { ListItemDescription } from "@/components/list";
import type { SettingsMessages } from "@/messages/app-messages";
import { discordBindingCodeExpiryMinutes } from "../discord-binding-config";
import { DiscordBindingRow } from "./DiscordBindingRow";

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
  const instructionTemplate = expired
    ? messages.discord.bindInstructionExpired
    : messages.discord.bindInstructionActive;

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
    <DiscordBindingRow>
      <ListItemDescription className="min-w-0 max-w-full">
        {renderBindInstruction({
          command: `/bind code:${code}`,
          darkMode,
          statusText: expired ? messages.discord.expired : remainingText,
          statusTone: expired ? "expired" : "normal",
          template: instructionTemplate,
        })}
      </ListItemDescription>
      <Button
        darkMode={darkMode}
        disabled={action !== null && action !== "cancel"}
        loading={action === "cancel"}
        onClick={onCancel}
      >
        {messages.discord.cancel}
      </Button>
    </DiscordBindingRow>
  );
}

function renderBindInstruction({
  command,
  darkMode,
  statusText,
  statusTone,
  template,
}: {
  command: string;
  darkMode: boolean;
  statusText: string | null;
  statusTone: "expired" | "normal";
  template: string;
}) {
  return (
    <span className="inline">
      {template.split(/(\{command\}|\{status\})/).map((part, index) =>
        renderInstructionPart({
          command,
          darkMode,
          index,
          part,
          statusText,
          statusTone,
        }),
      )}
    </span>
  );
}

function renderInstructionPart({
  command,
  darkMode,
  index,
  part,
  statusText,
  statusTone,
}: {
  command: string;
  darkMode: boolean;
  index: number;
  part: string;
  statusText: string | null;
  statusTone: "expired" | "normal";
}) {
  if (part === "{command}") {
    return (
      <code
        key={index}
        className="whitespace-nowrap rounded border border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-header-bg)] px-1.5 py-0.5 font-mono text-xs font-semibold text-[var(--aa-primary-text)]"
      >
        {command}
      </code>
    );
  }

  if (part === "{status}") {
    return (
      <span
        key={index}
        className={statusTone === "expired" ? versionMismatchClass(darkMode) : ""}
      >
        {statusText}
      </span>
    );
  }

  return part ? <span key={index}>{part}</span> : null;
}

function formatBindingCodeRemaining(
  value: string,
  currentTime: number | null,
  messages: SettingsMessages,
) {
  if (currentTime === null) {
    return messages.discord.bindCodeRemaining(discordBindingCodeExpiryMinutes);
  }

  const expiresAt = new Date(value).getTime();

  if (!Number.isFinite(expiresAt) || expiresAt <= currentTime) {
    return null;
  }

  const remainingMinutes = Math.ceil((expiresAt - currentTime) / 60_000);

  return messages.discord.bindCodeRemaining(
    Math.min(
      discordBindingCodeExpiryMinutes,
      Math.max(1, remainingMinutes),
    ),
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
