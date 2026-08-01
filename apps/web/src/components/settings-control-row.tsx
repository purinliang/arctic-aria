import type { ReactNode } from "react";
import {
  ListItem,
  ListItemContent,
  ListItemTextStack,
} from "./list";
import { Text } from "./text";
import { cx } from "./utils";

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
      layout="block"
      className={cx(
        "grid grid-cols-1 items-stretch sm:grid-cols-[minmax(0,1fr)_20rem]",
        className,
      )}
    >
      <ListItemContent
        title={
          <ListItemTextStack
            title={title}
            titleClassName="text-[var(--aa-primary-text)]"
            support={support}
            truncateTitle
          />
        }
      />
      {control ? (
        <div className="flex min-h-full w-full items-center justify-start sm:justify-end">
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
    <Text
      as="span"
      size="lg"
      weight="normal"
      tone="primary"
      truncate
      className={cx(
        "block w-full text-left sm:text-right",
        className,
      )}
    >
      {children}
    </Text>
  );
}
