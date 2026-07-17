import { cx } from "./utils";

export type Tone =
  | "blue"
  | "amber"
  | "cyan"
  | "emerald"
  | "neutral"
  | "red";

export function surfaceClass(_darkMode: boolean) {
  return "border-[var(--aa-color-border)] bg-[var(--aa-color-surface)] text-[var(--aa-color-text)]";
}

export function headerSurfaceClass(_darkMode: boolean) {
  return "border-[var(--aa-color-border)] bg-[var(--aa-color-header)]";
}

export function mutedTextClass(_darkMode: boolean) {
  return "text-[var(--aa-color-muted)]";
}

export function dividerClass(_darkMode: boolean) {
  return "divide-y divide-[var(--aa-color-border)]";
}

export function sectionBorderClass(_darkMode: boolean) {
  return "border-[var(--aa-color-border)]";
}

export function controlGroupSurfaceClass(_darkMode: boolean) {
  return "border-[var(--aa-color-border)] bg-[var(--aa-color-control-muted)]";
}

export function toneClass(darkMode: boolean, tone: Tone) {
  if (tone === "amber") {
    return darkMode
      ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (tone === "cyan") {
    return darkMode
      ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
      : "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  if (tone === "emerald") {
    return darkMode
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (tone === "neutral") {
    return "border-[var(--aa-color-border)] bg-[var(--aa-color-control-muted)] text-[var(--aa-color-muted)]";
  }

  if (tone === "red") {
    return darkMode
      ? "border-red-400/40 bg-red-950 text-red-50"
      : "border-red-200 bg-red-50 text-red-900";
  }

  return darkMode
    ? "border-blue-400/40 bg-blue-500/15 text-blue-200"
    : "border-blue-200 bg-blue-50 text-blue-700";
}

export function inputColorClass(darkMode: boolean, hasError = false) {
  if (hasError) {
    return darkMode
      ? "border-red-400 bg-[var(--aa-color-control)] text-[var(--aa-color-text)] focus:border-red-300"
      : "border-red-500 bg-[var(--aa-color-control)] text-[var(--aa-color-text)] focus:border-red-600";
  }

  return "border-[var(--aa-color-border)] bg-[var(--aa-color-control)] text-[var(--aa-color-text)] focus:border-[var(--aa-color-border-strong)]";
}

export function statusMessageClass(
  darkMode: boolean,
  tone: Extract<Tone, "amber" | "emerald" | "red">,
) {
  return cx("rounded-md border px-3 py-2 text-sm", toneClass(darkMode, tone));
}
