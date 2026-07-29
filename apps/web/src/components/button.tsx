import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  buttonHeightLgClass,
  buttonHeightMdClass,
  buttonHeightMdLgClass,
  buttonHeightSmClass,
  iconButtonSizeClass,
} from "./control-layout";
import { cx } from "./utils";

export type ButtonTone = "primary" | "secondary" | "ghost" | "success";
export type ButtonSize = "sm" | "md" | "md-lg" | "lg" | "icon";

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
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed",
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
  if (size === "sm") {
    return cx(buttonHeightSmClass, "px-3 text-sm");
  }

  if (size === "md") {
    return cx(buttonHeightMdClass, "px-3 text-sm");
  }

  if (size === "md-lg") {
    return cx(buttonHeightMdLgClass, "px-3 text-sm");
  }

  if (size === "lg") {
    return cx(buttonHeightLgClass, "px-4 text-sm");
  }

  if (size === "icon") {
    return cx(iconButtonSizeClass, "px-0 text-xs");
  }

  return cx(buttonHeightSmClass, "px-3 text-sm");
}

function buttonToneClass(
  darkMode: boolean,
  tone: ButtonTone,
  active: boolean,
) {
  if (tone === "primary" || active) {
    return "border border-[var(--aa-primary-button-hover-bg)] bg-[var(--aa-primary-button-bg)] text-[var(--aa-primary-button-text)] hover:border-[var(--aa-primary-button-hover-bg)] hover:bg-[var(--aa-primary-button-hover-bg)] hover:text-[var(--aa-primary-button-hover-text)] disabled:border-[var(--aa-primary-button-disabled-bg)] disabled:bg-[var(--aa-primary-button-disabled-bg)] disabled:text-[var(--aa-primary-button-disabled-text)] disabled:hover:border-[var(--aa-primary-button-disabled-bg)] disabled:hover:bg-[var(--aa-primary-button-disabled-bg)] disabled:hover:text-[var(--aa-primary-button-disabled-text)]";
  }

  if (tone === "ghost") {
    return "text-[var(--aa-secondary-button-text)] hover:bg-[var(--aa-secondary-button-hover-bg)] hover:text-[var(--aa-secondary-button-hover-text)] disabled:bg-[var(--aa-secondary-button-disabled-bg)] disabled:text-[var(--aa-secondary-button-disabled-text)] disabled:hover:bg-[var(--aa-secondary-button-disabled-bg)] disabled:hover:text-[var(--aa-secondary-button-disabled-text)]";
  }

  if (tone === "success") {
    return darkMode
      ? "border border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:border-emerald-300"
      : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300";
  }

  return "border border-[var(--aa-secondary-button-border)] bg-[var(--aa-secondary-button-bg)] text-[var(--aa-secondary-button-text)] hover:border-[var(--aa-secondary-button-hover-border)] hover:bg-[var(--aa-secondary-button-hover-bg)] hover:text-[var(--aa-secondary-button-hover-text)] disabled:border-[var(--aa-secondary-button-disabled-border)] disabled:bg-[var(--aa-secondary-button-disabled-bg)] disabled:text-[var(--aa-secondary-button-disabled-text)] disabled:hover:border-[var(--aa-secondary-button-disabled-border)] disabled:hover:bg-[var(--aa-secondary-button-disabled-bg)] disabled:hover:text-[var(--aa-secondary-button-disabled-text)]";
}
