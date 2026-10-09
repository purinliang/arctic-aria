import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Gemini key uses non-account identity and does not advertise a new password", async () => {
  const source = await readFile(new URL("../components/AIProviderSettings.tsx", import.meta.url), "utf8");
  assert.match(source, /<PasswordInput/);
  assert.match(source, /id="geminiApiKey" name="geminiApiKey"/);
  assert.match(source, /autoComplete="off"/);
  assert.doesNotMatch(source, /autoComplete="(?:new|current)-password"/);
  assert.doesNotMatch(source, /<form\b|onSubmit=/);
  for (const action of ["test", "save"]) {
    assert.match(source, new RegExp(`<Button type="button"[^>]*aria-label=\\{messages\\.${action}\\}`));
  }
});
