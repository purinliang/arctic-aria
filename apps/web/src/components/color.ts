import { cx } from "./utils";

export type Tone =
  | "amber"
  | "blue"
  | "cyan"
  | "emerald"
  | "indigo"
  | "lime"
  | "neutral"
  | "orange"
  | "pink"
  | "red";

export const panelColorClass =
  "border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-bg)] text-[var(--aa-primary-text)]";

export const panelHeaderColorClass =
  "border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-header-bg)]";

export const secondaryTextColorClass = "text-[var(--aa-secondary-text)]";

export const secondaryButtonDividerColorClass =
  "divide-y divide-[var(--aa-secondary-button-border)]";

export const secondaryButtonBorderColorClass =
  "border-[var(--aa-secondary-button-border)]";

export const panelHoverContainerColorClass =
  "border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-hover-bg)]";

const neutralToneClass =
  "border-[var(--aa-secondary-button-border)] bg-[var(--aa-panel-hover-bg)] text-[var(--aa-secondary-text)]";

const lightToneClasses = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  lime: "border-lime-200 bg-lime-50 text-lime-700",
  neutral: neutralToneClass,
  orange: "border-orange-200 bg-orange-50 text-orange-700",
  pink: "border-pink-200 bg-pink-50 text-pink-700",
  red: "border-red-200 bg-red-50 text-red-700",
} satisfies Record<Tone, string>;

const darkToneClasses = {
  amber: "border-amber-400/40 bg-amber-500/15 text-amber-200",
  blue: "border-blue-400/40 bg-blue-500/15 text-blue-200",
  cyan: "border-cyan-400/40 bg-cyan-500/15 text-cyan-200",
  emerald: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200",
  indigo: "border-indigo-400/40 bg-indigo-500/15 text-indigo-200",
  lime: "border-lime-400/40 bg-lime-500/15 text-lime-200",
  neutral: neutralToneClass,
  orange: "border-orange-400/40 bg-orange-500/15 text-orange-200",
  pink: "border-pink-400/40 bg-pink-500/15 text-pink-200",
  red: "border-red-400/40 bg-red-500/15 text-red-200",
} satisfies Record<Tone, string>;

export function toneClass(darkMode: boolean, tone: Tone = "neutral") {
  const toneClasses = darkMode ? darkToneClasses : lightToneClasses;

  return toneClasses[tone] ?? neutralToneClass;
}

export function secondaryInputControlColorClass(
  darkMode: boolean,
  hasError = false,
) {
  if (hasError) {
    return darkMode
      ? "border-red-400 bg-[var(--aa-secondary-button-bg)] text-[var(--aa-primary-text)] focus:border-[var(--aa-secondary-button-hover-border)] focus:bg-[var(--aa-secondary-button-hover-bg)]"
      : "border-red-500 bg-[var(--aa-secondary-button-bg)] text-[var(--aa-primary-text)] focus:border-[var(--aa-secondary-button-hover-border)] focus:bg-[var(--aa-secondary-button-hover-bg)]";
  }

  return "border-[var(--aa-secondary-button-border)] bg-[var(--aa-secondary-button-bg)] text-[var(--aa-primary-text)] focus:border-[var(--aa-secondary-button-hover-border)]";
}

export function statusMessageClass(
  darkMode: boolean,
  tone: Tone = "neutral",
) {
  return cx("rounded-md border px-3 py-2 text-sm", toneClass(darkMode, tone));
}
