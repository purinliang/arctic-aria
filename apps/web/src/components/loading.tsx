"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { controlGapClass, listRowPaddingClass } from "./spacing";
import { Text } from "./text";
import { cx } from "./utils";

export function LoadingLine({
  text,
  className,
}: {
  darkMode: boolean;
  text: string;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "flex items-center",
        controlGapClass,
        listRowPaddingClass,
        className,
      )}
    >
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      <Text tone="secondary">{text}</Text>
    </div>
  );
}

export function PendingText({
  active,
  idleText,
  pendingText,
  className,
}: {
  active: boolean;
  idleText: string;
  pendingText: string;
  className?: string;
}) {
  const dots = useProgressDots(active);
  const normalizedPendingText = pendingText.replace(/\.+$/, "");
  const visibleText = active
    ? `${normalizedPendingText}${dots}`
    : idleText;

  return <span className={className}>{visibleText}</span>;
}

export function useProgressDots(active: boolean) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    if (!active) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setDotCount((current) => (current === 3 ? 1 : current + 1));
    }, 450);

    return () => window.clearInterval(intervalId);
  }, [active]);

  return ".".repeat(dotCount);
}
