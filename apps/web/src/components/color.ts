import { cx } from "./utils";

export type Tone =
  | "blue"
  | "emerald"
  | "neutral"
  | "red";

export const panelColorClass =
  "border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-bg)] text-[var(--aa-primary-text)]";

export const panelHeaderColorClass =
  "border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-header-bg)]";

export const secondaryTextColorClass = "text-[var(--aa-secondary-text)]";

export const listDividerColorClass =
  "divide-y divide-[var(--aa-list-divider-border)]";

export const secondaryButtonBorderColorClass =
  "border-[var(--aa-secondary-button-border)]";

export const panelHoverContainerColorClass =
  "border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-hover-bg)]";

const neutralToneClass =
  "border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-hover-bg)] text-[var(--aa-secondary-text)]";

const lightToneClasses = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  neutral: neutralToneClass,
  red: "border-red-200 bg-red-50 text-red-700",
} satisfies Record<Tone, string>;

const darkToneClasses = {
  blue: "border-blue-400/40 bg-blue-950 text-blue-200",
  emerald: "border-emerald-400/40 bg-emerald-950 text-emerald-200",
  neutral: neutralToneClass,
  red: "border-red-400/40 bg-red-950 text-red-200",
} satisfies Record<Tone, string>;

export function toneClass(darkMode: boolean, tone: Tone = "neutral") {
  const toneClasses = darkMode ? darkToneClasses : lightToneClasses;

  return toneClasses[tone] ?? neutralToneClass;
}

export function textInputControlColorClass(
  darkMode: boolean,
  hasError = false,
) {
  if (hasError) {
    return darkMode
      ? "border-red-400 bg-[var(--aa-text-input-bg)] text-[var(--aa-text-input-text)] focus:border-[var(--aa-text-input-focus-border)] focus:bg-[var(--aa-text-input-focus-bg)] focus:text-[var(--aa-text-input-focus-text)]"
      : "border-red-500 bg-[var(--aa-text-input-bg)] text-[var(--aa-text-input-text)] focus:border-[var(--aa-text-input-focus-border)] focus:bg-[var(--aa-text-input-focus-bg)] focus:text-[var(--aa-text-input-focus-text)]";
  }

  return "border-[var(--aa-text-input-border)] bg-[var(--aa-text-input-bg)] text-[var(--aa-text-input-text)] focus:border-[var(--aa-text-input-focus-border)] focus:bg-[var(--aa-text-input-focus-bg)] focus:text-[var(--aa-text-input-focus-text)]";
}

export function statusMessageClass(
  darkMode: boolean,
  tone: Tone = "neutral",
) {
  return cx("rounded-md border px-3 py-2 text-sm", toneClass(darkMode, tone));
}
