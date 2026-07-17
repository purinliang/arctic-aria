import type { ReactNode } from "react";
import { secondaryTextColorClass, statusMessageClass } from "./color";
import type { Tone } from "./color";
import { cx } from "./utils";

export function PageTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1 className={cx("text-2xl font-semibold tracking-normal sm:text-3xl", className)}>
      {children}
    </h1>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <h2 className={cx("text-base font-semibold", className)}>{children}</h2>;
}

export function DescriptionText({
  darkMode,
  children,
  className,
}: {
  darkMode: boolean;
  children: ReactNode;
  className?: string;
}) {
  void darkMode;

  return (
    <p className={cx("text-sm leading-6", secondaryTextColorClass, className)}>
      {children}
    </p>
  );
}

export function LabelText({
  darkMode,
  children,
  className,
}: {
  darkMode: boolean;
  children: ReactNode;
  className?: string;
}) {
  void darkMode;

  return (
    <span
      className={cx(
        "text-left text-sm font-semibold leading-6",
        "text-[var(--aa-primary-text)]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SupportingText({
  children,
  className,
}: {
  darkMode: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx("text-xs leading-5", secondaryTextColorClass, className)}>
      {children}
    </span>
  );
}

export function InlineMessage({
  darkMode,
  tone = "neutral",
  children,
  className,
}: {
  darkMode: boolean;
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cx(statusMessageClass(darkMode, tone), className)}>
      {children}
    </p>
  );
}
