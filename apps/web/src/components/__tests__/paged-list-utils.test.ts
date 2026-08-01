import assert from "node:assert/strict";
import test from "node:test";
import { pagedListWindow } from "../paged-list-utils.ts";

test("paged list window returns the visible range for the requested page", () => {
  assert.deepEqual(
    pagedListWindow({ itemCount: 18, pageIndex: 1, pageSize: 8 }),
    {
      endIndex: 16,
      pageIndex: 1,
      pageNumber: 2,
      pageSize: 8,
      startIndex: 8,
      totalItems: 18,
      totalPages: 3,
    },
  );
});

test("paged list window clamps invalid pages and sizes", () => {
  assert.deepEqual(
    pagedListWindow({ itemCount: 3, pageIndex: 8, pageSize: 0 }),
    {
      endIndex: 3,
      pageIndex: 2,
      pageNumber: 3,
      pageSize: 1,
      startIndex: 2,
      totalItems: 3,
      totalPages: 3,
    },
  );
});

test("paged list window keeps empty lists stable", () => {
  assert.deepEqual(
    pagedListWindow({ itemCount: 0, pageIndex: 3, pageSize: 8 }),
    {
      endIndex: 0,
      pageIndex: 0,
      pageNumber: 0,
      pageSize: 8,
      startIndex: 0,
      totalItems: 0,
      totalPages: 1,
    },
  );
});
