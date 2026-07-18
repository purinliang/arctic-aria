"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

type PopoverPlacement = {
  vertical: "top" | "bottom";
  horizontal: "left" | "right";
};

const defaultPlacement: PopoverPlacement = {
  vertical: "bottom",
  horizontal: "left",
};

const viewportPadding = 16;
const anchorGap = 8;

export function usePopoverPlacement(open: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] =
    useState<PopoverPlacement>(defaultPlacement);

  const updatePlacement = useCallback(() => {
    const root = rootRef.current;
    const popover = popoverRef.current;

    if (!root || !popover) {
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const popoverHeight = popover.offsetHeight;
    const popoverWidth = popover.offsetWidth;
    const spaceAbove = rootRect.top - viewportPadding;
    const spaceBelow = window.innerHeight - rootRect.bottom - viewportPadding;
    const overflowsRight =
      rootRect.left + popoverWidth > window.innerWidth - viewportPadding;

    setPlacement({
      vertical:
        spaceBelow < popoverHeight + anchorGap && spaceAbove > spaceBelow
          ? "top"
          : "bottom",
      horizontal: overflowsRight ? "right" : "left",
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    updatePlacement();
    window.addEventListener("resize", updatePlacement);

    return () => {
      window.removeEventListener("resize", updatePlacement);
    };
  }, [open, updatePlacement]);

  return {
    placement,
    popoverRef,
    rootRef,
    updatePlacement,
  };
}

export function popoverPlacementClass(placement: PopoverPlacement) {
  return [
    placement.vertical === "top" ? "bottom-full mb-2" : "top-full mt-2",
    placement.horizontal === "right" ? "right-0" : "left-0",
  ].join(" ");
}

export function popoverHitAreaPlacementClass(placement: PopoverPlacement) {
  return [
    placement.vertical === "top" ? "bottom-full pb-2" : "top-full pt-2",
    placement.horizontal === "right" ? "right-0" : "left-0",
  ].join(" ");
}
