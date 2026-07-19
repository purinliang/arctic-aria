export function projectTaskProgressText(
  doneCount: number,
  totalCount: number,
) {
  if (totalCount === 0) {
    return "No tasks yet";
  }

  return `${doneCount} of ${totalCount} tasks done`;
}
