"use client";

import { Info } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "./button";
import { panelColorClass } from "./color";
import { popoverPlacementClass, usePopoverPlacement } from "./forms/use-popover-placement";
import { popoverPaddingClass } from "./spacing";
import { DescriptionText } from "./text";
import { cx } from "./utils";

export type PageHelpContent = {
  title: string;
  summary: string;
  sections: readonly { title: string; body: string }[];
};

export function PageHelpButton({
  darkMode,
  content,
  labels,
  className,
}: {
  darkMode: boolean;
  content: PageHelpContent;
  labels: { open: string; close: string };
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const tooltipId = useId();
  const tooltipOpen = hovered || focused;
  const { rootRef, popoverRef, placement } = usePopoverPlacement(tooltipOpen);

  return (
    <div ref={rootRef} className={cx("relative shrink-0", className)}>
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon"
        aria-label={labels.open}
        aria-disabled="true"
        className="cursor-default!"
        aria-describedby={tooltipOpen ? tooltipId : undefined}
        icon={<Info size={18} aria-hidden="true" />}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setHovered(false);
            setFocused(false);
          }
        }}
      />
      {tooltipOpen ? (
        <div
          ref={popoverRef}
          id={tooltipId}
          role="tooltip"
          className={cx(
            "pointer-events-none absolute z-40 w-[min(18rem,calc(100vw-2rem))] rounded-md border shadow-lg",
            popoverPaddingClass,
            panelColorClass,
            popoverPlacementClass(placement),
          )}
        >
          <DescriptionText darkMode={darkMode}>{content.summary}</DescriptionText>
        </div>
      ) : null}
    </div>
  );
}
