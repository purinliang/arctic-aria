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
    return darkMode
      ? "border border-white bg-white text-black hover:bg-neutral-200"
      : "border border-neutral-950 bg-neutral-950 text-white hover:bg-neutral-800";
  }

  if (tone === "ghost") {
    return darkMode
      ? "text-neutral-300 hover:bg-white/10 hover:text-white"
      : "text-neutral-500 hover:bg-neutral-100 hover:text-black";
  }

  if (tone === "success") {
    return darkMode
      ? "border border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:border-emerald-300"
      : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300";
  }

  return darkMode
    ? "border border-neutral-700 text-neutral-200 hover:border-white hover:text-white"
    : "border border-neutral-300 text-neutral-700 hover:border-neutral-500";
}
