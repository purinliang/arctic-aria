import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const inputFieldSourcePath = resolve(
  fileURLToPath(new URL(".", import.meta.url)),
  "../input-field.tsx",
);

test("FieldLabel no longer wraps controls with a native <label> element", () => {
  return readFile(inputFieldSourcePath, "utf8").then((source) => {
    assert.equal(source.includes("<label"), false);
    assert.equal(source.includes('className="relative grid gap-1.5"'), true);
  });
});
