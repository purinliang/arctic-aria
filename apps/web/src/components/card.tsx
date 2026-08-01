import type { ReactNode } from "react";
import { panelHeaderColorClass, panelColorClass } from "./color";
import { cardHeaderPaddingClass, iconGapClass, inlineGapClass } from "./spacing";
import { Text, TextStack } from "./text";
import { cx } from "./utils";

export function Card({
  className,
  children,
}: {
  darkMode: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cx("rounded-md border", panelColorClass, className)}
    >
      {children}
    </article>
  );
}

export function CardHeader({
  icon,
  title,
  description,
  meta,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
  darkMode: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "grid grid-cols-[minmax(0,1fr)_auto] items-start rounded-t-md border-b",
        cardHeaderPaddingClass,
        inlineGapClass,
        panelHeaderColorClass,
        className,
      )}
    >
      <div className="min-w-0">
        <div className={cx("flex items-center", iconGapClass)}>
          {icon ? (
            <span className="inline-flex text-current">{icon}</span>
          ) : null}
          <Text as="h2" size="lg" weight="semibold" tone="current" truncate>
            {title}
          </Text>
        </div>
        {description ? (
          <TextStack
            description={description}
            descriptionProps={{
              size: "sm",
              className: "mt-[var(--aa-space-text-title-desc)]",
            }}
          />
        ) : null}
      </div>
      {action || meta ? (
        <div className="shrink-0 justify-self-end">
          {action ?? (
            <Text as="span" size="md" tone="secondary">
              {meta}
            </Text>
          )}
        </div>
      ) : null}
    </div>
  );
}
