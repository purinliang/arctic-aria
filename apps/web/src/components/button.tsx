import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

export type ButtonTone = "primary" | "secondary" | "ghost" | "success";
export type ButtonSize = "xs" | "sm" | "md" | "icon-sm" | "field";

export function Button({
  darkMode,
  tone = "secondary",
  size = "sm",
  active = false,
  loading = false,
  icon,
  loadingIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  darkMode: boolean;
  tone?: ButtonTone;
  size?: ButtonSize;
  active?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  loadingIcon?: ReactNode;
}) {
  return (
    <button
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        buttonSizeClass(size),
        buttonToneClass(darkMode, tone, active),
        className,
      )}
      type="button"
      disabled={disabled || loading}
      {...props}
    >
      {loading ? loadingIcon : icon}
      {children}
    </button>
  );
}

function buttonSizeClass(size: ButtonSize) {
  if (size === "xs") {
    return "h-8 px-3 text-xs";
  }

  if (size === "md") {
    return "h-11 px-4 text-sm";
  }

  if (size === "icon-sm") {
    return "h-9 w-9 px-0 text-xs";
  }

  if (size === "field") {
    return "h-11 px-4 text-sm";
  }

  return "h-9 px-3 text-xs";
}

function buttonToneClass(
  darkMode: boolean,
  tone: ButtonTone,
  active: boolean,
) {
  if (tone === "primary" || active) {
    return "border border-[var(--aa-color-primary)] bg-[var(--aa-color-primary)] text-[var(--aa-color-inverse-text)] hover:border-[var(--aa-color-primary-hover)] hover:bg-[var(--aa-color-primary-hover)]";
  }

  if (tone === "ghost") {
    return "text-[var(--aa-color-muted)] hover:bg-[var(--aa-color-hover)] hover:text-[var(--aa-color-text)]";
  }

  if (tone === "success") {
    return darkMode
      ? "border border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:border-emerald-300"
      : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300";
  }

  return "border border-[var(--aa-color-border)] text-[var(--aa-color-muted)] hover:border-[var(--aa-color-border-strong)] hover:text-[var(--aa-color-text)]";
}
