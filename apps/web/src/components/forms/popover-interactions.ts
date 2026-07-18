import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

const interactivePopoverTargetSelector = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[role='option']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function keepPopoverOpenOnBlankPointerDown(
  event: ReactPointerEvent<HTMLElement>,
) {
  keepPopoverOpenOnBlankInteraction(event);
}

export function keepPopoverOpenOnBlankMouseDown(
  event: ReactMouseEvent<HTMLElement>,
) {
  keepPopoverOpenOnBlankInteraction(event);
}

export function keepPopoverOpenOnBlankDoubleClick(
  event: ReactMouseEvent<HTMLElement>,
) {
  keepPopoverOpenOnBlankInteraction(event);
}

export function keepPopoverOpenOnBlankClick(
  event: ReactMouseEvent<HTMLElement>,
) {
  keepPopoverOpenOnBlankInteraction(event);
}

function keepPopoverOpenOnBlankInteraction(
  event: ReactPointerEvent<HTMLElement> | ReactMouseEvent<HTMLElement>,
) {
  event.stopPropagation();

  if (!(event.target instanceof Element)) {
    return;
  }

  if (event.target.closest(interactivePopoverTargetSelector)) {
    return;
  }

  event.preventDefault();
}
