"use client";

// Settings Page - Discord Bound Account Field.
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/button";
import { FieldLabel, TextInput } from "@/components/forms/input-field";
import { cx } from "@/components/utils";

export function DiscordBoundAccountField({
  accountId,
  className,
  darkMode,
  hidden,
  hideLabel,
  label,
  onToggleHidden,
  viewLabel,
}: {
  accountId: string;
  className?: string;
  darkMode: boolean;
  hidden: boolean;
  hideLabel: string;
  label: string;
  onToggleHidden: () => void;
  viewLabel: string;
}) {
  return (
    <div className={cx("min-w-0", className)}>
      <FieldLabel darkMode={darkMode} label={label}>
        <TextInput
          darkMode={darkMode}
          disabled
          readOnly
          type={hidden ? "password" : "text"}
          value={accountId}
          trailing={
            <Button
              darkMode={darkMode}
              tone="ghost"
              size="icon-sm"
              aria-label={hidden ? viewLabel : hideLabel}
              icon={
                hidden ? (
                  <Eye size={14} aria-hidden="true" />
                ) : (
                  <EyeOff size={14} aria-hidden="true" />
                )
              }
              onClick={onToggleHidden}
            />
          }
        />
      </FieldLabel>
    </div>
  );
}
