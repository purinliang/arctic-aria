import { cx } from "./utils";

export type Tone =
  | "blue"
  | "amber"
  | "cyan"
  | "emerald"
  | "neutral"
  | "red";

export function surfaceClass(darkMode: boolean) {
  return darkMode
    ? "border-neutral-800 bg-black text-white"
    : "border-neutral-300 bg-white text-black";
}

export function headerSurfaceClass(darkMode: boolean) {
  return darkMode
    ? "border-neutral-800 bg-neutral-950"
    : "border-neutral-200 bg-neutral-50";
}

export function mutedTextClass(darkMode: boolean) {
  return darkMode ? "text-neutral-400" : "text-neutral-500";
}

export function dividerClass(darkMode: boolean) {
  return darkMode ? "divide-y divide-neutral-900" : "divide-y divide-neutral-200";
}

export function sectionBorderClass(darkMode: boolean) {
  return darkMode ? "border-neutral-800" : "border-neutral-200";
}

export function controlGroupSurfaceClass(darkMode: boolean) {
  return darkMode
    ? "border-neutral-800 bg-neutral-950"
    : "border-neutral-300 bg-neutral-100";
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
    return darkMode
      ? "border-neutral-700 bg-neutral-900 text-neutral-300"
      : "border-neutral-200 bg-neutral-100 text-neutral-600";
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
      ? "border-red-400 bg-black text-white focus:border-red-300"
      : "border-red-500 bg-white text-black focus:border-red-600";
  }

  return darkMode
    ? "border-neutral-700 bg-black text-white focus:border-white"
    : "border-neutral-300 bg-white text-black focus:border-neutral-600";
}

export function statusMessageClass(
  darkMode: boolean,
  tone: Extract<Tone, "amber" | "emerald" | "red">,
) {
  return cx("rounded-md border px-3 py-2 text-sm", toneClass(darkMode, tone));
}
