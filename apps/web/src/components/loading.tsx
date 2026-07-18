"use client";

import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { secondaryTextColorClass } from "./color";
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
        "flex items-center gap-2 px-4 py-4 text-sm",
        secondaryTextColorClass,
        className,
      )}
    >
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{text}</span>
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
