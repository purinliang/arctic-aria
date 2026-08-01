import type { ReactNode } from "react";
import type { Tone } from "./color";
import { toneClass } from "./color";
import { tagPaddingClass } from "./spacing";
import { cx } from "./utils";

export function Tag({
  darkMode,
  tone = "neutral",
  children,
}: {
  darkMode: boolean;
  tone?: Exclude<Tone, "red">;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "rounded-md border text-[length:var(--aa-font-size-xs)] font-[var(--aa-font-weight-semibold)] leading-[var(--aa-line-height-xs)]",
        tagPaddingClass,
        toneClass(darkMode, tone),
      )}
    >
      {children}
    </span>
  );
}
