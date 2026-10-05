"use client";

import { Info } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";
import { panelColorClass } from "./color";
import { DialogFrame, DialogHeader, DialogOverlay } from "./dialog";
import { popoverPlacementClass, usePopoverPlacement } from "./forms/use-popover-placement";
import { bodyStackClass, popoverPaddingClass, sectionStackClass } from "./spacing";
import { DescriptionText, TextStack } from "./text";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [returnFocusTo, setReturnFocusTo] = useState<HTMLButtonElement | null>(null);
  const tooltipId = useId();
  const tooltipOpen = (hovered || focused) && !dialogOpen;
  const { rootRef, popoverRef, placement } = usePopoverPlacement(tooltipOpen);

  return (
    <div ref={rootRef} className={cx("relative shrink-0", className)}>
      <Button
        darkMode={darkMode}
        tone="ghost"
        size="icon"
        aria-label={labels.open}
        aria-haspopup="dialog"
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
        onClick={(event) => {
          setHovered(false);
          setReturnFocusTo(event.currentTarget);
          setDialogOpen(true);
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
      {dialogOpen ? createPortal(
        <PageHelpDialog
          darkMode={darkMode}
          content={content}
          closeLabel={labels.close}
          returnFocusTo={returnFocusTo}
          onClose={() => setDialogOpen(false)}
        />,
        document.body,
      ) : null}
    </div>
  );
}

function PageHelpDialog({
  darkMode,
  content,
  closeLabel,
  returnFocusTo,
  onClose,
}: {
  darkMode: boolean;
  content: PageHelpContent;
  closeLabel: string;
  returnFocusTo: HTMLButtonElement | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      returnFocusTo?.focus();
    };
  }, [returnFocusTo]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={content.title}
      className="m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0 text-inherit"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          event.preventDefault();
          dialogRef.current?.querySelector("button")?.focus();
        }
      }}
    >
      <DialogOverlay>
        <DialogFrame darkMode={darkMode}>
          <div>
            <DialogHeader
              darkMode={darkMode}
              title={content.title}
              closeLabel={closeLabel}
              onClose={onClose}
            />
          </div>
          <div className={sectionStackClass}>
            <DescriptionText darkMode={darkMode}>{content.summary}</DescriptionText>
            <div className={bodyStackClass}>
              {content.sections.map((section) => (
                <TextStack
                  key={section.title}
                  title={section.title}
                  titleProps={{ as: "h4" }}
                  description={section.body}
                />
              ))}
            </div>
          </div>
        </DialogFrame>
      </DialogOverlay>
    </dialog>
  );
}
