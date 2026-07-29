// Settings Page - Settings Control Row.
import type { ReactNode } from "react";
import {
  ListItem,
  ListItemContent,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import { cx } from "@/components/utils";

export function SettingsControlRow({
  darkMode,
  title,
  support,
  control,
  className,
}: {
  darkMode: boolean;
  title: ReactNode;
  support?: ReactNode;
  control?: ReactNode;
  className?: string;
}) {
  return (
    <ListItem
      darkMode={darkMode}
      className={cx(
        "grid grid-cols-1 items-stretch sm:grid-cols-[minmax(0,1fr)_20rem]",
        className,
      )}
    >
      <ListItemContent
        className="grid gap-0.5"
        title={
          <ListItemTitle
            weight="normal"
            className="text-[var(--aa-primary-text)]"
          >
            {title}
          </ListItemTitle>
        }
        support={
          support ? (
            <ListItemSupportingText className="block">
              {support}
            </ListItemSupportingText>
          ) : undefined
        }
      />
      {control ? (
        <div
          className={cx(
            "flex min-h-full w-full items-center justify-start sm:justify-end",
          )}
        >
          {control}
        </div>
      ) : null}
    </ListItem>
  );
}

export function SettingsControlValue({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "block w-full min-w-0 truncate text-left text-base font-normal leading-5 text-[var(--aa-primary-text)] sm:text-right",
        className,
      )}
    >
      {children}
    </span>
  );
}
