export function menuFocusIndex(key: string,index: number,count: number) {
  if (count === 0) return null;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  if (key === 'ArrowDown') return (index + 1) % count;
  if (key === 'ArrowUp') return (index <= 0 ? count : index) - 1;
  return null;
}
