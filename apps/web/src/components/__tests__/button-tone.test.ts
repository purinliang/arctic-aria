import assert from "node:assert/strict";
import test from "node:test";
import { buttonToneClass } from "../button-tone.ts";

test("danger buttons have dedicated background, text, hover, and disabled tokens", () => {
  const classes = buttonToneClass("danger");
  for (const token of ["bg", "text", "border", "hover-bg", "hover-border", "disabled-bg", "disabled-text"]) {
    assert.ok(classes.includes(`--aa-danger-button-${token}`));
  }
  assert.ok(classes.includes("disabled:hover:bg-[var(--aa-danger-button-disabled-bg)]"));
  assert.equal(buttonToneClass("danger", true), classes);
  assert.ok(!classes.includes("--aa-primary-button"));
});

test("normal button tones and active tabs retain their existing token families", () => {
  assert.ok(buttonToneClass("primary").includes("--aa-primary-button-bg"));
  assert.ok(buttonToneClass("secondary").includes("--aa-secondary-button-border"));
  assert.ok(buttonToneClass("ghost").includes("disabled:bg-transparent"));
  assert.equal(buttonToneClass("ghost", true), buttonToneClass("primary"));
});
