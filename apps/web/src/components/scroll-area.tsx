"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  HTMLAttributes,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { cx } from "./utils";

type ScrollbarMode = "visible" | "auto-hide";

type ScrollbarState = {
  canScroll: boolean;
  visible: boolean;
  thumbHeight: number;
  thumbTop: number;
};

const hiddenScrollbarState: ScrollbarState = {
  canScroll: false,
  visible: false,
  thumbHeight: 0,
  thumbTop: 0,
};

type ScrollbarDragState = {
  pointerId: number;
  startY: number;
  startScrollTop: number;
  maxScrollTop: number;
  maxThumbTop: number;
};

const scrollbarTrackPadding = 8;
const scrollbarMinThumbHeight = 32;
const scrollbarHideDelayMs = 900;

type ScrollAreaProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "className" | "onScroll"
> & {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  refreshKey?: string | number | boolean;
  scrollbar?: ScrollbarMode;
  thumbClassName?: string;
  viewportClassName?: string;
  viewportStyle?: CSSProperties;
};

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  function ScrollArea(
    {
      children,
      className,
      contentClassName,
      refreshKey,
      scrollbar = "visible",
      thumbClassName,
      viewportClassName,
      viewportStyle,
      ...props
    },
    ref,
  ) {
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const hideTimer = useRef<number | null>(null);
    const dragState = useRef<ScrollbarDragState | null>(null);
    const [dragging, setDragging] = useState(false);
    const [scrollbarState, setScrollbarState] = useState<ScrollbarState>(
      hiddenScrollbarState,
    );

    const clearHideTimer = useCallback(() => {
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    }, []);

    const updateScrollbarState = useCallback(
      (visible: boolean) => {
        const viewport = viewportRef.current;

        if (!viewport || viewport.clientHeight <= 0) {
          setScrollbarState(hiddenScrollbarState);
          return;
        }

        const canScroll = viewport.scrollHeight > viewport.clientHeight + 1;

        if (!canScroll) {
          setScrollbarState(hiddenScrollbarState);
          return;
        }

        const trackHeight = Math.max(
          0,
          viewport.clientHeight - scrollbarTrackPadding * 2,
        );
        const thumbHeight = Math.max(
          scrollbarMinThumbHeight,
          Math.round(
            (viewport.clientHeight / viewport.scrollHeight) * trackHeight,
          ),
        );
        const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
        const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
        const thumbTop =
          scrollbarTrackPadding +
          (maxScrollTop > 0
            ? (viewport.scrollTop / maxScrollTop) * maxThumbTop
            : 0);

        setScrollbarState({
          canScroll: true,
          visible,
          thumbHeight,
          thumbTop,
        });
      },
      [],
    );

    const scheduleAutoHide = useCallback(() => {
      if (scrollbar === "visible") {
        return;
      }

      clearHideTimer();

      hideTimer.current = window.setTimeout(() => {
        updateScrollbarState(false);
      }, scrollbarHideDelayMs);
    }, [clearHideTimer, scrollbar, updateScrollbarState]);

    useEffect(() => {
      updateScrollbarState(false);

      function handleResize() {
        updateScrollbarState(scrollbar === "visible");
      }

      window.addEventListener("resize", handleResize);

      const resizeObserver =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() =>
              updateScrollbarState(scrollbar === "visible"),
            );

      if (resizeObserver) {
        if (viewportRef.current) {
          resizeObserver.observe(viewportRef.current);
        }

        if (contentRef.current) {
          resizeObserver.observe(contentRef.current);
        }
      }

      return () => {
        clearHideTimer();

        window.removeEventListener("resize", handleResize);
        resizeObserver?.disconnect();
      };
    }, [clearHideTimer, refreshKey, scrollbar, updateScrollbarState]);

    function handleScroll() {
      updateScrollbarState(true);

      if (scrollbar === "visible") {
        return;
      }

      scheduleAutoHide();
    }

    function handleThumbPointerDown(
      event: ReactPointerEvent<HTMLSpanElement>,
    ) {
      if (event.button !== 0) {
        return;
      }

      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
      const trackHeight = Math.max(
        0,
        viewport.clientHeight - scrollbarTrackPadding * 2,
      );
      const maxThumbTop = Math.max(
        0,
        trackHeight - scrollbarState.thumbHeight,
      );

      if (maxScrollTop <= 0 || maxThumbTop <= 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      clearHideTimer();
      event.currentTarget.setPointerCapture(event.pointerId);
      dragState.current = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startScrollTop: viewport.scrollTop,
        maxScrollTop,
        maxThumbTop,
      };
      setDragging(true);
      updateScrollbarState(true);
    }

    function handleThumbPointerMove(
      event: ReactPointerEvent<HTMLSpanElement>,
    ) {
      const activeDrag = dragState.current;

      if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
        return;
      }

      const viewport = viewportRef.current;

      if (!viewport) {
        return;
      }

      event.preventDefault();
      const dragOffset = event.clientY - activeDrag.startY;
      const nextScrollTop =
        activeDrag.startScrollTop +
        (dragOffset / activeDrag.maxThumbTop) * activeDrag.maxScrollTop;

      viewport.scrollTop = Math.min(
        activeDrag.maxScrollTop,
        Math.max(0, nextScrollTop),
      );
      updateScrollbarState(true);
    }

    function handleThumbPointerEnd(event: ReactPointerEvent<HTMLSpanElement>) {
      const activeDrag = dragState.current;

      if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
        return;
      }

      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      dragState.current = null;
      setDragging(false);
      updateScrollbarState(true);
      scheduleAutoHide();
    }

    const thumbVisible =
      scrollbar === "visible" || scrollbarState.visible || dragging;

    return (
      <div ref={ref} className={cx("min-h-0", className)} {...props}>
        <div
          ref={viewportRef}
          className={cx(
            "overflow-y-auto",
            "aa-scrollbar-hidden-native",
            viewportClassName,
          )}
          style={viewportStyle}
          onScroll={handleScroll}
        >
          <div ref={contentRef} className={contentClassName}>
            {children}
          </div>
        </div>

        {scrollbarState.canScroll ? (
          <span
            className={cx(
              "absolute right-0 top-0 flex w-4 cursor-grab touch-none justify-end pr-1 transition-opacity duration-200 active:cursor-grabbing",
              thumbVisible
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0",
              dragging ? "cursor-grabbing" : null,
            )}
            style={{
              height: scrollbarState.thumbHeight,
              transform: `translateY(${scrollbarState.thumbTop}px)`,
            }}
            onPointerDown={handleThumbPointerDown}
            onPointerMove={handleThumbPointerMove}
            onPointerUp={handleThumbPointerEnd}
            onPointerCancel={handleThumbPointerEnd}
          >
            <span
              className={cx(
                "pointer-events-none block h-full w-[5px] rounded-full bg-[var(--aa-secondary-button-hover-bg)]",
                thumbClassName,
              )}
              aria-hidden="true"
            />
          </span>
        ) : null}
      </div>
    );
  },
);
