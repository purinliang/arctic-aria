import { Sparkles } from "lucide-react";
import { cx } from "./utils";

type ArcticAriaLogoVariant = "inline" | "sidebar";

export function ArcticAriaLogo({
  variant = "inline",
  className,
  workspaceLabel,
}: {
  variant?: ArcticAriaLogoVariant;
  className?: string;
  workspaceLabel?: string;
}) {
  if (variant === "sidebar") {
    return (
      <div className={cx("min-w-0", className)}>
        <div className="flex items-center gap-2">
          <Sparkles size={17} aria-hidden="true" />
          <span className="truncate text-sm font-semibold tracking-normal">
            ArcticAria
          </span>
        </div>
        {workspaceLabel ? (
          <p className="mt-3 truncate text-2xl font-semibold tracking-normal">
            {workspaceLabel}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cx("flex items-center justify-center gap-2", className)}>
      <Sparkles size={22} aria-hidden="true" />
      <h1 className="text-2xl font-semibold tracking-normal">Arctic Aria</h1>
    </div>
  );
}
