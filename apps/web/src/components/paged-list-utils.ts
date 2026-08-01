export type PagedListWindowInput = {
  itemCount: number;
  pageIndex: number;
  pageSize: number;
};

export type PagedListWindow = {
  endIndex: number;
  pageIndex: number;
  pageNumber: number;
  pageSize: number;
  startIndex: number;
  totalItems: number;
  totalPages: number;
};

export function pagedListWindow({
  itemCount,
  pageIndex,
  pageSize,
}: PagedListWindowInput): PagedListWindow {
  const normalizedItemCount = Math.max(0, Math.floor(itemCount));
  const normalizedPageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(
    1,
    Math.ceil(normalizedItemCount / normalizedPageSize),
  );
  const normalizedPageIndex =
    normalizedItemCount === 0
      ? 0
      : clamp(Math.floor(pageIndex), 0, totalPages - 1);
  const startIndex =
    normalizedItemCount === 0
      ? 0
      : normalizedPageIndex * normalizedPageSize;
  const endIndex = Math.min(
    normalizedItemCount,
    startIndex + normalizedPageSize,
  );

  return {
    endIndex,
    pageIndex: normalizedPageIndex,
    pageNumber: normalizedItemCount === 0 ? 0 : normalizedPageIndex + 1,
    pageSize: normalizedPageSize,
    startIndex,
    totalItems: normalizedItemCount,
    totalPages,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
