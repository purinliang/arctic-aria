import { cx } from "./utils";

export function HorizontalProgressBar({
  primary,
  secondary = null,
  ariaLabel,
  className,
}: {
  primary: number;
  secondary?: number | null;
  ariaLabel?: string;
  className?: string;
}) {
  const primaryPercent = percentage(primary);
  const secondaryPercent = secondary === null ? null : percentage(secondary);

  return (
    <div
      className={cx(
        "relative h-1.5 w-full overflow-hidden rounded-full border border-[var(--aa-secondary-button-border)] bg-[var(--aa-secondary-button-bg)]",
        className,
      )}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
    >
      {secondaryPercent !== null ? (
        <div
          className="absolute inset-y-0 left-0 bg-[var(--aa-secondary-button-hover-bg)]"
          style={{ width: `${secondaryPercent}%` }}
        />
      ) : null}
      <div
        className="absolute inset-y-0 left-0 bg-[var(--aa-primary-button-bg)]"
        style={{ width: `${primaryPercent}%` }}
      />
    </div>
  );
}

function percentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value * 100));
}
