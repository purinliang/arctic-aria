export function orderOptionsForSelectPopover<T>(
  options: readonly T[],
  opensAbove: boolean,
) {
  return opensAbove ? [...options].reverse() : options;
}
