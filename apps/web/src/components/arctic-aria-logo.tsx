import Image from "next/image";
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
      workspaceLabel && workspaceLabel.length <= 4
        ? "text-[2.05rem]"
        : "text-[1.50rem]";

    return (
      <div className={cx("min-w-0", className)}>
        <div className="flex items-center gap-2">
          <ArcticAriaIcon className="h-[18px] w-[18px]" />
          <span className="truncate text-sm font-semibold leading-none tracking-normal">
            {brandText}
          </span>
        </div>
        {workspaceLabel ? (
          <p
            className={cx(
              "mt-0 truncate font-semibold leading-tight tracking-normal",
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
      <ArcticAriaIcon className="h-8 w-8" />
      <h1 className="text-2xl font-semibold tracking-normal">{brandText}</h1>
    </div>
  );
}

function ArcticAriaIcon({ className }: { className: string }) {
  return (
    <Image
      src="/icons/app-icon.svg"
      alt=""
      aria-hidden="true"
      width={32}
      height={32}
      unoptimized
      draggable={false}
      className={cx("shrink-0 select-none", className)}
    />
  );
}
