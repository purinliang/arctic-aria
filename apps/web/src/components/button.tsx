import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonToneClass } from "./button-tone";
import type { ButtonTone } from "./button-tone";
import {
  buttonHeightLgClass,
  buttonHeightMdClass,
  buttonHeightMdLgClass,
  buttonHeightSmClass,
  iconButtonSizeClass,
} from "./control-layout";
import { controlGapClass } from "./spacing";
import { cx } from "./utils";

export type { ButtonTone } from "./button-tone";
export type ButtonSize = "sm" | "md" | "md-lg" | "lg" | "icon" | "text";

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
  void darkMode;
  return (
    <button
      className={cx(
        "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md font-[var(--aa-font-weight-semibold)] leading-[var(--aa-line-height-md)] transition disabled:cursor-not-allowed",
        controlGapClass,
        buttonSizeClass(size),
        buttonToneClass(tone, active),
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
  if (size === "text") return "px-0 text-[length:var(--aa-font-size-md)]";
  if (size === "sm") {
    return cx(
      buttonHeightSmClass,
      "px-[var(--aa-space-popover-x)] text-[length:var(--aa-font-size-md)]",
    );
  }

  if (size === "md") {
    return cx(
      buttonHeightMdClass,
      "px-[var(--aa-space-popover-x)] text-[length:var(--aa-font-size-md)]",
    );
  }

  if (size === "md-lg") {
    return cx(
      buttonHeightMdLgClass,
      "px-[var(--aa-space-popover-x)] text-[length:var(--aa-font-size-md)]",
    );
  }

  if (size === "lg") {
    return cx(
      buttonHeightLgClass,
      "px-[var(--aa-space-card-body-x)] text-[length:var(--aa-font-size-md)]",
    );
  }

  if (size === "icon") {
    return cx(iconButtonSizeClass, "px-0 text-[length:var(--aa-font-size-xs)]");
  }

  return cx(
    buttonHeightSmClass,
    "px-[var(--aa-space-popover-x)] text-[length:var(--aa-font-size-md)]",
  );
}
