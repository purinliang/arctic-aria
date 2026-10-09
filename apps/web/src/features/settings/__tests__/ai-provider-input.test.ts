import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Gemini key uses non-account identity and does not advertise a new password", async () => {
  const source = await readFile(new URL("../components/AIProviderSettings.tsx", import.meta.url), "utf8");
  assert.match(source, /<MaskedTextInput/);
  assert.match(source, /id="geminiApiKey" name="geminiApiKey"/);
  assert.match(source, /autoComplete="off"/);
  assert.match(source, /autoCapitalize="off" autoCorrect="off"/);
  assert.match(source, /spellCheck=\{false\}/);
  assert.doesNotMatch(source, /autoComplete="(?:new|current)-password"/);
  assert.doesNotMatch(source, /<form\b|onSubmit=/);
  assert.doesNotMatch(source, /messages\.test|replacePlaceholder|testAIProvider/);
  for (const action of ["save", "remove"]) {
    assert.match(source, new RegExp(`<Button type="button"[^>]*aria-label=\\{messages\\.${action}\\}`));
  }
});
