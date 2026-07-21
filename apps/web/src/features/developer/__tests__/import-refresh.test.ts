import assert from "node:assert/strict";
import test from "node:test";
import { refreshAfterDeveloperImport } from "../import-refresh.ts";

test("developer project imports refresh project data", () => {
  const calls = { projects: 0, routines: 0 };

  refreshAfterDeveloperImport("projects", {
    refreshProjectData: () => {
      calls.projects += 1;
    },
    refreshRoutineData: () => {
      calls.routines += 1;
    },
  });

  assert.deepEqual(calls, { projects: 1, routines: 0 });
});

test("developer routine imports refresh routine data", () => {
  const calls = { projects: 0, routines: 0 };

  refreshAfterDeveloperImport("routines", {
    refreshProjectData: () => {
      calls.projects += 1;
    },
    refreshRoutineData: () => {
      calls.routines += 1;
    },
  });

  assert.deepEqual(calls, { projects: 0, routines: 1 });
});
