import type { ReactNode } from "react";
import {
  inlineGapClass,
  sectionStackClass,
  subsectionStackClass,
} from "./spacing";
import { TextStack } from "./text";
import { cx } from "./utils";

export function ContentSection({
  action,
  bodyClassName,
  children,
  className,
  darkMode,
  description,
  title,
}: {
  action?: ReactNode;
  bodyClassName?: string;
  children?: ReactNode;
  className?: string;
  darkMode: boolean;
  description?: ReactNode;
  title: ReactNode;
}) {
  return (
    <section className={cx("min-w-0", className)}>
      <ContentHeader
        action={action}
        darkMode={darkMode}
        description={description}
        title={title}
        titleElement="h2"
      />
      {children ? (
        <div
          className={cx(
            "mt-[var(--aa-space-subsection-gap)] min-w-0",
            sectionStackClass,
            bodyClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function ContentSubsection({
  action,
  bodyClassName,
  children,
  className,
  darkMode,
  description,
  title,
}: {
  action?: ReactNode;
  bodyClassName?: string;
  children?: ReactNode;
  className?: string;
  darkMode: boolean;
  description?: ReactNode;
  title: ReactNode;
}) {
  return (
    <section className={cx("min-w-0", className)}>
      <ContentHeader
        action={action}
        darkMode={darkMode}
        description={description}
        title={title}
        titleElement="h3"
      />
      {children ? (
        <div
          className={cx(
            "mt-[var(--aa-space-subsection-gap)] min-w-0",
            subsectionStackClass,
            bodyClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}

function ContentHeader({
  action,
  darkMode,
  description,
  title,
  titleElement,
}: {
  action?: ReactNode;
  darkMode: boolean;
  description?: ReactNode;
  title: ReactNode;
  titleElement: "h2" | "h3";
}) {
  const Title = titleElement;

  void darkMode;

  return (
    <header
      className={cx(
        "flex min-w-0 flex-wrap items-start justify-between",
        inlineGapClass,
      )}
    >
      <TextStack
        className="min-w-0"
        title={title}
        titleProps={{
          as: Title,
          size: titleElement === "h2" ? "lg" : "md",
          weight: "semibold",
        }}
        description={description}
        descriptionProps={{ size: "md" }}
      />
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
