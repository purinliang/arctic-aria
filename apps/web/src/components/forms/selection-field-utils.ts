export function orderOptionsForSelectPopover<T>(
  options: readonly T[],
  opensAbove: boolean,
) {
  return opensAbove ? [...options].reverse() : options;
}

export function selectedOptionRenderIndexForSelectPopover<
  T extends { value: string },
>(
  options: readonly T[],
  value: string,
  opensAbove: boolean,
) {
  const selectedIndex = options.findIndex((option) => option.value === value);

  if (selectedIndex === -1) {
    return -1;
  }

  return opensAbove
    ? options.length - 1 - selectedIndex
    : selectedIndex;
}
