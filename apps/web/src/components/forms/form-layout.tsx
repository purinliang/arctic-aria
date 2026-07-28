import type { ReactNode } from "react";
import {
  formActionGapClass,
  formActionGroupClass,
  formFieldStackClass,
  formFieldsClass,
  formGridClass,
  formGridThreeClass,
  formGridTwoClass,
  formSectionsClass,
} from "../control-layout";
import { cx } from "../utils";

export function FormFields({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx(formFieldsClass, className)}>{children}</div>;
}

export function FormSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cx(formFieldsClass, className)}>{children}</section>;
}

export function FormSections({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx(formSectionsClass, className)}>{children}</div>;
}

export function FormGrid({
  children,
  columns = 1,
  className,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const gridClass =
    columns === 3
      ? formGridThreeClass
      : columns === 2
        ? formGridTwoClass
        : formGridClass;

  return <div className={cx(gridClass, className)}>{children}</div>;
}

export function FormFieldStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx(formFieldStackClass, className)}>{children}</div>;
}

export function FormActions({
  children,
  grouped = false,
  className,
}: {
  children: ReactNode;
  grouped?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        grouped ? formActionGroupClass : formActionGapClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
