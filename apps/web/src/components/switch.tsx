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
  void darkMode;

  return (
    <button
      className={cx(
        "inline-flex h-7 w-12 shrink-0 items-center rounded-full border p-1 transition",
        checked
          ? "border-[var(--aa-primary-button-hover-bg)] bg-[var(--aa-primary-button-bg)] hover:bg-[var(--aa-primary-button-hover-bg)]"
          : "border-[var(--aa-secondary-button-border)] bg-[var(--aa-secondary-button-bg)] hover:border-[var(--aa-secondary-button-hover-border)] hover:bg-[var(--aa-secondary-button-hover-bg)]",
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
            ? "translate-x-5 bg-[var(--aa-primary-button-text)]"
            : "translate-x-0 bg-[var(--aa-secondary-text)]",
        )}
      />
    </button>
  );
}
