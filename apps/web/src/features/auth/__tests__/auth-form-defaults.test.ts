import assert from "node:assert/strict";
import test from "node:test";
import { demoLoginInputForSearch } from "../auth-form-defaults.ts";
import { validateLoginSubmit } from "../validation.ts";

test("demo mode prefills only the login credentials", () => {
  assert.deepEqual(demoLoginInputForSearch("?mode=demo"), {
    username: "demo",
    password: "demodemo",
  });
  assert.deepEqual(demoLoginInputForSearch("?source=portfolio&mode=demo"), {
    username: "demo",
    password: "demodemo",
  });
  assert.equal(demoLoginInputForSearch(""), null);
  assert.equal(demoLoginInputForSearch("?mode=register"), null);
  assert.equal(demoLoginInputForSearch("?mode=Demo"), null);
  const demo = demoLoginInputForSearch("?mode=demo");
  assert.ok(demo);
  assert.deepEqual(validateLoginSubmit(demo), {});
});
