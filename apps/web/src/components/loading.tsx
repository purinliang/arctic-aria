import { LoaderCircle } from "lucide-react";
import { mutedTextClass } from "./color";
import { cx } from "./utils";

export function LoadingLine({
  darkMode,
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
        mutedTextClass(darkMode),
        className,
      )}
    >
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
