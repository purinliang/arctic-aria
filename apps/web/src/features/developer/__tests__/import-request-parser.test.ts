import assert from "node:assert/strict";
import test from "node:test";
import { readDeveloperImportRequest } from "../server/import-request-parser.ts";

test("developer import request reads raw markdown bodies", async () => {
  const result = await readDeveloperImportRequest(
    new Request("https://example.test", {
      method: "POST",
      headers: {
        "content-type": "text/markdown",
      },
      body: "# Project: Find a job",
    }),
    "project",
  );

  assert.deepEqual(result, {
    ok: true,
    data: {
      format: "markdown",
      value: "# Project: Find a job",
    },
  });
});

test("developer import request reads markdown envelopes", async () => {
  const result = await readDeveloperImportRequest(
    jsonRequest({
      format: "markdown",
      source: "# Routine: Morning walk",
    }),
    "routine",
  );

  assert.deepEqual(result, {
    ok: true,
    data: {
      format: "markdown",
      value: "# Routine: Morning walk",
    },
  });
});

test("developer import request reads canonical json directly", async () => {
  const result = await readDeveloperImportRequest(
    jsonRequest({
      project: {
        title: "Find a job",
      },
    }),
    "project",
  );

  assert.deepEqual(result, {
    ok: true,
    data: {
      format: "json",
      value: {
        project: {
          title: "Find a job",
        },
      },
    },
  });
});

test("developer import request rejects invalid envelopes", async () => {
  const result = await readDeveloperImportRequest(
    jsonRequest({
      format: "markdown",
      source: {
        project: {
          title: "Find a job",
        },
      },
    }),
    "project",
  );

  assert.equal(result.ok, false);

  if (!result.ok) {
    assert.equal(result.code, "project_import_invalid");
    assert.equal(result.field, "source");
  }
});

function jsonRequest(body: unknown) {
  return new Request("https://example.test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
