import type { ReactNode } from "react";
import { DescriptionText } from "./text";
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
        titleClassName="text-base"
        titleElement="h2"
      />
      {children ? (
        <div className={cx("mt-3 min-w-0", bodyClassName)}>{children}</div>
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
        titleClassName="text-sm"
        titleElement="h3"
      />
      {children ? (
        <div className={cx("mt-3 min-w-0", bodyClassName)}>{children}</div>
      ) : null}
    </section>
  );
}

function ContentHeader({
  action,
  darkMode,
  description,
  title,
  titleClassName,
  titleElement,
}: {
  action?: ReactNode;
  darkMode: boolean;
  description?: ReactNode;
  title: ReactNode;
  titleClassName: string;
  titleElement: "h2" | "h3";
}) {
  const Title = titleElement;

  return (
    <header className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <Title className={cx("font-semibold leading-5", titleClassName)}>
          {title}
        </Title>
        {description ? (
          <DescriptionText darkMode={darkMode} className="mt-0.5">
            {description}
          </DescriptionText>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
