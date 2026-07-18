"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cx } from "./utils";

type ScrollbarMode = "native" | "auto-hide";

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
      scrollbar = "native",
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
    const [scrollbarState, setScrollbarState] = useState<ScrollbarState>(
      hiddenScrollbarState,
    );

    const updateScrollbarState = useCallback(
      (visible: boolean) => {
        if (scrollbar !== "auto-hide") {
          setScrollbarState(hiddenScrollbarState);
          return;
        }

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

        const trackPadding = 8;
        const trackHeight = Math.max(
          0,
          viewport.clientHeight - trackPadding * 2,
        );
        const thumbHeight = Math.max(
          32,
          Math.round(
            (viewport.clientHeight / viewport.scrollHeight) * trackHeight,
          ),
        );
        const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
        const maxThumbTop = Math.max(0, trackHeight - thumbHeight);
        const thumbTop =
          trackPadding +
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
      [scrollbar],
    );

    useEffect(() => {
      updateScrollbarState(false);

      if (scrollbar !== "auto-hide") {
        return;
      }

      function handleResize() {
        updateScrollbarState(false);
      }

      window.addEventListener("resize", handleResize);

      const resizeObserver =
        typeof ResizeObserver === "undefined"
          ? null
          : new ResizeObserver(() => updateScrollbarState(false));

      if (resizeObserver) {
        if (viewportRef.current) {
          resizeObserver.observe(viewportRef.current);
        }

        if (contentRef.current) {
          resizeObserver.observe(contentRef.current);
        }
      }

      return () => {
        if (hideTimer.current !== null) {
          window.clearTimeout(hideTimer.current);
        }

        window.removeEventListener("resize", handleResize);
        resizeObserver?.disconnect();
      };
    }, [refreshKey, scrollbar, updateScrollbarState]);

    function handleScroll() {
      if (scrollbar !== "auto-hide") {
        return;
      }

      updateScrollbarState(true);

      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current);
      }

      hideTimer.current = window.setTimeout(() => {
        updateScrollbarState(false);
      }, 900);
    }

    return (
      <div ref={ref} className={cx("relative min-h-0", className)} {...props}>
        <div
          ref={viewportRef}
          className={cx(
            "overflow-y-auto",
            scrollbar === "auto-hide" ? "aa-scrollbar-hidden-native" : "",
            viewportClassName,
          )}
          style={viewportStyle}
          onScroll={handleScroll}
        >
          <div ref={contentRef} className={contentClassName}>
            {children}
          </div>
        </div>

        {scrollbar === "auto-hide" && scrollbarState.canScroll ? (
          <span
            className={cx(
              "pointer-events-none absolute right-1 top-0 block w-0.5 rounded-full bg-[var(--aa-secondary-button-hover-bg)] transition-opacity duration-200",
              scrollbarState.visible ? "opacity-100" : "opacity-0",
              thumbClassName,
            )}
            style={{
              height: scrollbarState.thumbHeight,
              transform: `translateY(${scrollbarState.thumbTop}px)`,
            }}
            aria-hidden="true"
          />
        ) : null}
      </div>
    );
  },
);
