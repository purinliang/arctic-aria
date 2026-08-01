import { Sparkles } from "lucide-react";
import { iconGapClass } from "./spacing";
import { Text } from "./text";
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
        <div className={cx("flex items-center", iconGapClass)}>
          <Sparkles size={17} aria-hidden="true" />
          <Text
            as="span"
            size="md"
            weight="semibold"
            leading="xs"
            truncate
            className="tracking-normal"
          >
            {brandText}
          </Text>
        </div>
        {workspaceLabel ? (
          <p
            className={cx(
              "mt-0 truncate font-[var(--aa-font-weight-semibold)] leading-[1.12] tracking-normal",
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
    <div className={cx("flex items-center justify-center", iconGapClass, className)}>
      <Sparkles size={22} aria-hidden="true" />
      <Text as="h1" size="page" weight="semibold" className="tracking-normal">
        {brandText}
      </Text>
    </div>
  );
}
