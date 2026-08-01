export const englishPaginationMessages = {
  first: "First page",
  previous: "Previous page",
  next: "Next page",
  last: "Last page",
  page: (pageNumber: number, totalPages: number) =>
    `Page ${pageNumber} / ${totalPages}`,
};

export type PaginationMessages = typeof englishPaginationMessages;

export const simplifiedChinesePaginationMessages: PaginationMessages = {
  first: "第一页",
  previous: "上一页",
  next: "下一页",
  last: "最后一页",
  page: (pageNumber, totalPages) => `第 ${pageNumber} / ${totalPages} 页`,
};
