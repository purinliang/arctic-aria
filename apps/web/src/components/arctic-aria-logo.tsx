import { Sparkles } from "lucide-react";
import { cx } from "./utils";

type ArcticAriaLogoVariant = "inline" | "sidebar";

export function ArcticAriaLogo({
  brandText = "Arctic Aria",
  variant = "inline",
  className,
  workspaceLabel,
}: {
  brandText?: string;
  variant?: ArcticAriaLogoVariant;
  className?: string;
  workspaceLabel?: string;
}) {
  if (variant === "sidebar") {
    const workspaceTextClass =
      workspaceLabel && workspaceLabel.length <= 4 ? "text-3xl" : "text-2xl";

    return (
      <div className={cx("min-w-0", className)}>
        <div className="flex items-center gap-2">
          <Sparkles size={17} aria-hidden="true" />
          <span className="truncate text-sm font-semibold leading-none tracking-normal">
            {brandText}
          </span>
        </div>
        {workspaceLabel ? (
          <p
            className={cx(
              "mt-1 truncate font-semibold leading-tight tracking-normal",
              workspaceTextClass,
            )}
          >
            {workspaceLabel}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cx("flex items-center justify-center gap-2", className)}>
      <Sparkles size={22} aria-hidden="true" />
      <h1 className="text-2xl font-semibold tracking-normal">{brandText}</h1>
    </div>
  );
}
