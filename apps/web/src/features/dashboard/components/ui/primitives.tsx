import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

type ButtonTone = "primary" | "secondary" | "ghost" | "success";
type ButtonSize = "xs" | "sm" | "md" | "icon-sm";

export function cx(
  ...classes: Array<string | false | null | undefined>
) {
  return classes.filter(Boolean).join(" ");
}

export function panelClass(darkMode: boolean) {
  return darkMode
    ? "border-neutral-800 bg-black text-white"
    : "border-slate-300 bg-white text-slate-950";
}

export function mutedTextClass(darkMode: boolean) {
  return darkMode ? "text-neutral-400" : "text-slate-500";
}

export function dividerClass(darkMode: boolean) {
  return darkMode ? "divide-y divide-neutral-900" : "divide-y divide-slate-200";
}

export function sectionBorderClass(darkMode: boolean) {
  return darkMode ? "border-neutral-800" : "border-slate-200";
}

export function modalClass(darkMode: boolean) {
  return cx(
    "relative max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-md border p-4 shadow-2xl",
    darkMode
      ? "border-neutral-800 bg-black text-white"
      : "border-slate-200 bg-white text-slate-950",
  );
}

export function DashboardPanel({
  darkMode,
  className,
  children,
}: {
  darkMode: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cx("rounded-md border", panelClass(darkMode), className)}>
      {children}
    </section>
  );
}

export function DashboardButton({
  darkMode,
  tone = "secondary",
  size = "sm",
  active = false,
  icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  darkMode: boolean;
  tone?: ButtonTone;
  size?: ButtonSize;
  active?: boolean;
  icon?: ReactNode;
}) {
  return (
    <button
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        buttonSizeClass(size),
        buttonToneClass(darkMode, tone, active),
        className,
      )}
      type="button"
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export function TextInput({
  darkMode,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  darkMode: boolean;
}) {
  return (
    <input
      className={cx(inputClass(darkMode), className)}
      {...props}
    />
  );
}

export function TextArea({
  darkMode,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  darkMode: boolean;
}) {
  return (
    <textarea
      className={cx(inputClass(darkMode), "resize-y", className)}
      {...props}
    />
  );
}

export function InlineMessage({
  darkMode,
  children,
  className,
}: {
  darkMode: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cx(
        "rounded-md border px-3 py-2 text-sm",
        darkMode
          ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
          : "border-amber-200 bg-amber-50 text-amber-700",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function ListItem({
  darkMode,
  className,
  children,
}: {
  darkMode: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <article
      className={cx(
        "flex items-start justify-between gap-3 px-4 py-4",
        darkMode ? "hover:bg-neutral-950" : "hover:bg-slate-50",
        className,
      )}
    >
      {children}
    </article>
  );
}

export function Tag({
  darkMode,
  tone = "blue",
  children,
}: {
  darkMode: boolean;
  tone?: "blue" | "amber" | "cyan" | "emerald" | "neutral";
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "rounded-md border px-2 py-0.5 text-xs font-semibold",
        tagToneClass(darkMode, tone),
      )}
    >
      {children}
    </span>
  );
}

function buttonSizeClass(size: ButtonSize) {
  if (size === "xs") {
    return "h-8 px-3 text-xs";
  }

  if (size === "md") {
    return "h-11 px-4 text-sm";
  }

  if (size === "icon-sm") {
    return "h-9 w-9 px-0 text-xs";
  }

  return "h-9 px-3 text-xs";
}

function buttonToneClass(
  darkMode: boolean,
  tone: ButtonTone,
  active: boolean,
) {
  if (tone === "primary" || active) {
    return darkMode
      ? "border border-white bg-white text-black hover:bg-neutral-200"
      : "border border-slate-950 bg-slate-950 text-white hover:bg-slate-800";
  }

  if (tone === "ghost") {
    return darkMode
      ? "text-neutral-300 hover:bg-white/10 hover:text-white"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-950";
  }

  if (tone === "success") {
    return darkMode
      ? "border border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:border-emerald-300"
      : "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300";
  }

  return darkMode
    ? "border border-neutral-700 text-neutral-200 hover:border-white hover:text-white"
    : "border border-slate-300 text-slate-700 hover:border-slate-500";
}

function inputClass(darkMode: boolean) {
  return cx(
    "w-full rounded-md border px-3 py-2 text-sm outline-none transition",
    darkMode
      ? "border-neutral-700 bg-black text-white focus:border-white"
      : "border-slate-300 bg-white text-slate-950 focus:border-slate-600",
  );
}

function tagToneClass(
  darkMode: boolean,
  tone: "blue" | "amber" | "cyan" | "emerald" | "neutral",
) {
  if (tone === "amber") {
    return darkMode
      ? "border-amber-400/40 bg-amber-500/15 text-amber-200"
      : "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (tone === "emerald") {
    return darkMode
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (tone === "cyan") {
    return darkMode
      ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
      : "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  if (tone === "neutral") {
    return darkMode
      ? "border-neutral-700 bg-neutral-900 text-neutral-300"
      : "border-slate-200 bg-slate-100 text-slate-600";
  }

  return darkMode
    ? "border-blue-400/40 bg-blue-500/15 text-blue-200"
    : "border-blue-200 bg-blue-50 text-blue-700";
}
