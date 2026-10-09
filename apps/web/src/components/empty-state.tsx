import { secondaryButtonBorderColorClass } from "./color";
import { cardBodyPaddingClass } from "./spacing";
import { TextStack } from "./text";
import { cx } from "./utils";

export function EmptyState({
  text,
  description,
  className,
}: {
  darkMode: boolean;
  text: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "aa-empty-state w-full min-w-0 rounded-md border border-dashed bg-transparent text-center [overflow-wrap:anywhere]",
        secondaryButtonBorderColorClass,
        cardBodyPaddingClass,
        className,
      )}
    >
      <TextStack
        title={text}
        titleProps={{ size: "md", weight: "normal", tone: "secondary" }}
        description={description}
        descriptionProps={{ size: "sm" }}
      />
    </div>
  );
}
