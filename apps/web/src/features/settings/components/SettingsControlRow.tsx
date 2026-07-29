// Settings Page - Settings Control Row.
import type { ReactNode } from "react";
import {
  ListItem,
  ListItemContent,
  ListItemSupportingText,
  ListItemTitle,
} from "@/components/list";
import { cx } from "@/components/utils";

type SettingsControlWidth = "auto" | "field";

export function SettingsControlRow({
  darkMode,
  title,
  support,
  control,
  controlWidth = "auto",
  className,
}: {
  darkMode: boolean;
  title: ReactNode;
  support?: ReactNode;
  control?: ReactNode;
  controlWidth?: SettingsControlWidth;
  className?: string;
}) {
  return (
    <ListItem
      darkMode={darkMode}
      className={cx("flex-wrap items-center sm:flex-nowrap", className)}
    >
      <ListItemContent
        title={<ListItemTitle>{title}</ListItemTitle>}
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
            "flex w-full shrink-0 items-center justify-start sm:justify-end",
            controlWidth === "field" ? "sm:w-80" : "sm:w-auto",
          )}
        >
          {control}
        </div>
      ) : null}
    </ListItem>
  );
}
