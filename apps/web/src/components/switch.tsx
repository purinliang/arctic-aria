import { cx } from "./utils";

export function Switch({
  checked,
  darkMode,
  label,
  onChange,
}: {
  checked: boolean;
  darkMode: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      className={cx(
        "h-7 w-12 rounded-full border p-1 transition",
        checked
          ? darkMode
            ? "border-white bg-white"
            : "border-slate-950 bg-slate-950"
          : darkMode
            ? "border-neutral-700 bg-neutral-900"
            : "border-slate-300 bg-slate-200",
      )}
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span
        className={cx(
          "block h-4 w-4 rounded-full transition",
          checked
            ? darkMode
              ? "translate-x-5 bg-black"
              : "translate-x-5 bg-white"
            : "translate-x-0 bg-white",
        )}
      />
    </button>
  );
}
