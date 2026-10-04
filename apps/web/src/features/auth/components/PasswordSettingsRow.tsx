"use client";

// Settings Page - Account Password Row.
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/button";
import { SettingsControlRow } from "@/components/settings-control-row";
import type { NotificationMessages, SettingsMessages } from "@/messages/app-messages";
import { PasswordChangeDialog } from "./PasswordChangeDialog";

export function PasswordSettingsRow({
  darkMode,
  messages,
  notificationMessages,
  showErrorNotification,
  showSuccessNotification,
}: {
  darkMode: boolean;
  messages: SettingsMessages["password"];
  notificationMessages: NotificationMessages;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <SettingsControlRow
        darkMode={darkMode}
        title={messages.title}
        support={messages.description}
        control={
          <Button
            darkMode={darkMode}
            icon={<KeyRound size={14} aria-hidden="true" />}
            onClick={() => setOpen(true)}
          >
            {messages.change}
          </Button>
        }
      />
      {open ? (
        <PasswordChangeDialog
          darkMode={darkMode}
          messages={messages}
          notificationMessages={notificationMessages}
          showErrorNotification={showErrorNotification}
          showSuccessNotification={showSuccessNotification}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
