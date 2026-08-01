import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { statusMessageClass } from "./color";
import type { Tone } from "./color";
import {
  textDescSupportGapClass,
  textTitleDescGapClass,
} from "./spacing";
import { cx } from "./utils";

export type TextSize = "xs" | "sm" | "md" | "lg" | "xl" | "page";
export type TextWeight = "light" | "normal" | "medium" | "semibold";
export type TextTone = "primary" | "secondary" | "inverse" | "current";
export type TextLeading = "normal" | TextSize;

type TextOwnProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  leading?: TextLeading;
  size?: TextSize;
  tone?: TextTone;
  truncate?: boolean;
  weight?: TextWeight;
};

type TextProps = TextOwnProps &
  Omit<HTMLAttributes<HTMLElement>, "children" | "className">;

type TextSlotProps = {
  as?: ElementType;
  className?: string;
  leading?: TextLeading;
  size?: TextSize;
  tone?: TextTone;
  truncate?: boolean;
  weight?: TextWeight;
};

export function Text({
  as: Component = "span",
  children,
  className,
  leading = "normal",
  size = "md",
  tone = "primary",
  truncate = false,
  weight = "normal",
  ...props
}: TextProps) {
  return (
    <Component
      className={cx(
        textSizeClass(size),
        textLeadingClass(leading, size),
        textWeightClass(weight),
        textToneClass(tone),
        truncate ? "block min-w-0 truncate" : undefined,
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function TextStack({
  className,
  description,
  descriptionProps,
  support,
  supportProps,
  title,
  titleProps,
}: {
  className?: string;
  description?: ReactNode;
  descriptionProps?: TextSlotProps;
  support?: ReactNode;
  supportProps?: TextSlotProps;
  title?: ReactNode;
  titleProps?: TextSlotProps;
}) {
  const hasTitle = hasTextSlot(title);
  const hasDescription = hasTextSlot(description);
  const hasSupport = hasTextSlot(support);

  return (
    <div className={cx("min-w-0", className)}>
      {hasTitle ? (
        <Text
          as={titleProps?.as ?? "div"}
          size={titleProps?.size ?? "md"}
          weight={titleProps?.weight ?? "semibold"}
          tone={titleProps?.tone ?? "primary"}
          leading={titleProps?.leading ?? "normal"}
          truncate={titleProps?.truncate}
          className={cx("min-w-0", titleProps?.className)}
        >
          {title}
        </Text>
      ) : null}
      {hasDescription ? (
        <Text
          as={descriptionProps?.as ?? "p"}
          size={descriptionProps?.size ?? "md"}
          weight={descriptionProps?.weight ?? "normal"}
          tone={descriptionProps?.tone ?? "secondary"}
          leading={descriptionProps?.leading ?? "normal"}
          truncate={descriptionProps?.truncate}
          className={cx(
            "min-w-0",
            hasTitle ? textTitleDescGapClass : undefined,
            descriptionProps?.className,
          )}
        >
          {description}
        </Text>
      ) : null}
      {hasSupport ? (
        <Text
          as={supportProps?.as ?? "div"}
          size={supportProps?.size ?? "sm"}
          weight={supportProps?.weight ?? "normal"}
          tone={supportProps?.tone ?? "secondary"}
          leading={supportProps?.leading ?? "normal"}
          truncate={supportProps?.truncate}
          className={cx(
            "min-w-0",
            hasTitle || hasDescription ? textDescSupportGapClass : undefined,
            supportProps?.className,
          )}
        >
          {support}
        </Text>
      ) : null}
    </div>
  );
}

export function PageTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Text
      as="h1"
      size="page"
      weight="semibold"
      tone="primary"
      className={cx("tracking-normal", className)}
    >
      {children}
    </Text>
  );
}

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Text as="h2" size="lg" weight="semibold" tone="primary" className={className}>
      {children}
    </Text>
  );
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
    <Text as="p" size="md" weight="normal" tone="secondary" className={className}>
      {children}
    </Text>
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
    <Text
      as="span"
      size="md"
      weight="semibold"
      tone="primary"
      className={cx("text-left", className)}
    >
      {children}
    </Text>
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
    <Text as="span" size="sm" weight="normal" tone="secondary" className={className}>
      {children}
    </Text>
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

function textSizeClass(size: TextSize) {
  return textSizeClasses[size];
}

function textLeadingClass(leading: TextLeading, size: TextSize) {
  const lineHeight = leading === "normal" ? size : leading;

  return textLeadingClasses[lineHeight];
}

function textWeightClass(weight: TextWeight) {
  return textWeightClasses[weight];
}

function textToneClass(tone: TextTone) {
  if (tone === "secondary") {
    return "text-[var(--aa-secondary-text)]";
  }

  if (tone === "inverse") {
    return "text-[var(--aa-inverse-text)]";
  }

  if (tone === "current") {
    return "text-current";
  }

  return "text-[var(--aa-primary-text)]";
}

function hasTextSlot(value: ReactNode) {
  return value !== null && value !== undefined && value !== false;
}

const textSizeClasses = {
  xs: "text-[length:var(--aa-font-size-xs)]",
  sm: "text-[length:var(--aa-font-size-sm)]",
  md: "text-[length:var(--aa-font-size-md)]",
  lg: "text-[length:var(--aa-font-size-lg)]",
  xl: "text-[length:var(--aa-font-size-xl)]",
  page: "text-[length:var(--aa-font-size-page)]",
} satisfies Record<TextSize, string>;

const textLeadingClasses = {
  xs: "leading-[var(--aa-line-height-xs)]",
  sm: "leading-[var(--aa-line-height-sm)]",
  md: "leading-[var(--aa-line-height-md)]",
  lg: "leading-[var(--aa-line-height-lg)]",
  xl: "leading-[var(--aa-line-height-xl)]",
  page: "leading-[var(--aa-line-height-page)]",
} satisfies Record<TextSize, string>;

const textWeightClasses = {
  light: "font-[var(--aa-font-weight-light)]",
  normal: "font-[var(--aa-font-weight-normal)]",
  medium: "font-[var(--aa-font-weight-medium)]",
  semibold: "font-[var(--aa-font-weight-semibold)]",
} satisfies Record<TextWeight, string>;
