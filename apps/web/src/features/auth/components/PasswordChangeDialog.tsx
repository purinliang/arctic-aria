"use client";

// Settings Page - Change Password Dialog.
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useRef, useState } from "react";
import { notifyActionFailure, runNotifiedServerAction } from "@/app-shell/action-notifications";
import { Button } from "@/components/button";
import { fieldIconButtonSizeClass } from "@/components/control-layout";
import {
  DialogActionRow,
  DialogFrame,
  DialogHeader,
  DialogOverlay,
  DialogPrimaryButton,
} from "@/components/dialog";
import { FormFields } from "@/components/forms/form-layout";
import { FieldError, FieldLabel, PasswordInput } from "@/components/forms/input-field";
import { PendingText } from "@/components/loading";
import type { NotificationMessages, SettingsMessages } from "@/messages/app-messages";
import { changePassword } from "../password-change-actions";
import {
  normalizePasswordChangeInput,
  validatePasswordChangeInput,
} from "../password-change-validation";
import type { PasswordChangeErrors, PasswordChangeInput } from "../password-change-validation";

export function PasswordChangeDialog({
  darkMode,
  messages,
  notificationMessages,
  showErrorNotification,
  showSuccessNotification,
  onClose,
}: {
  darkMode: boolean;
  messages: SettingsMessages["password"];
  notificationMessages: NotificationMessages;
  showErrorNotification: (message: string, title?: string) => void;
  showSuccessNotification: (message: string, title?: string) => void;
  onClose: () => void;
}) {
  const [input, setInput] = useState<PasswordChangeInput>({
    currentPassword: "",
    newPassword: "",
    repeatPassword: "",
  });
  const [errors, setErrors] = useState<PasswordChangeErrors>({});
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const saving = useRef(false);

  async function submit() {
    if (saving.current) return;
    const normalized = normalizePasswordChangeInput(input);
    const fieldErrors = validatePasswordChangeInput(normalized);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      showErrorNotification(messages.results.password_change_validation_failed, messages.validationTitle);
      return;
    }
    saving.current = true;
    setPending(true);
    try {
      const response = await runNotifiedServerAction({
        action: () => changePassword(normalized),
        messages: notificationMessages,
        showErrorNotification,
      });
      if (!response.ok) return;
      const result = response.value;
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        notifyActionFailure({
          result,
          resultMessages: messages.results,
          fallbackTitle: messages.failedTitle,
          notificationMessages,
          showErrorNotification,
        });
        return;
      }
      onClose();
      showSuccessNotification(messages.results.password_changed, messages.successTitle);
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return (
    <DialogOverlay>
      <form
        role="dialog"
        aria-modal="true"
        aria-label={messages.change}
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <DialogFrame darkMode={darkMode} size="sm">
          <DialogHeader
            darkMode={darkMode}
            title={messages.change}
            closeLabel={messages.close}
            onClose={() => { if (!saving.current) onClose(); }}
          />
          <FormFields>
            {(["currentPassword", "newPassword", "repeatPassword"] as const).map((field) => (
              <div
                key={field}
                className={errors[field]
                  ? "pb-[calc(2*var(--aa-line-height-md)+2*var(--aa-space-popover-y)+var(--aa-space-control-gap))]"
                  : undefined}
              >
              <FieldLabel darkMode={darkMode} label={messages[field]}>
                <PasswordInput
                  darkMode={darkMode}
                  aria-label={messages[field]}
                  name={field}
                  value={input[field]}
                  disabled={pending}
                  visible={visible}
                  autoFocus={field === "currentPassword"}
                  autoComplete={field === "currentPassword" ? "current-password" : "new-password"}
                  hasError={Boolean(errors[field])}
                  trailing={
                    <Button
                      darkMode={darkMode}
                      tone="ghost"
                      size="icon"
                      className={fieldIconButtonSizeClass}
                      aria-label={visible ? messages.hidePassword : messages.showPassword}
                      title={visible ? messages.hidePassword : messages.showPassword}
                      icon={visible ? <EyeOff size={16} /> : <Eye size={16} />}
                      onClick={() => setVisible((current) => !current)}
                    />
                  }
                  onChange={(event) => {
                    setInput((current) => ({ ...current, [field]: event.target.value }));
                    setErrors({});
                  }}
                />
                {errors[field] ? <FieldError darkMode={darkMode}>{messages.errors[errors[field]]}</FieldError> : null}
              </FieldLabel>
              </div>
            ))}
          </FormFields>
          <DialogActionRow>
            <DialogPrimaryButton
              darkMode={darkMode}
              type="submit"
              disabled={pending}
              icon={<KeyRound size={14} aria-hidden="true" />}
            >
              <PendingText active={pending} idleText={messages.save} pendingText={messages.saving} />
            </DialogPrimaryButton>
          </DialogActionRow>
        </DialogFrame>
      </form>
    </DialogOverlay>
  );
}
