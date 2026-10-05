import assert from "node:assert/strict";
import test from "node:test";
import { demoLoadingDelayMs, isDemoEntrySearch } from "../demo-entry.ts";

test("only an explicit demo=true query requests automatic demo entry", () => {
  assert.equal(isDemoEntrySearch("?demo=true"), true);
  assert.equal(isDemoEntrySearch("?source=portfolio&demo=true"), true);
  for (const search of ["", "?mode=demo", "?demo=false", "?demo=1", "?demo=True", "?demo="]) {
    assert.equal(isDemoEntrySearch(search), false);
  }
  assert.equal(demoLoadingDelayMs, 2_000);
});
