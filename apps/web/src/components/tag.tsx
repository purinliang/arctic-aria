import type { ReactNode } from "react";
import type { Tone } from "./color";
import { toneClass } from "./color";
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
        "rounded-md border px-2 py-0.5 text-xs font-semibold",
        toneClass(darkMode, tone),
      )}
    >
      {children}
    </span>
  );
}
