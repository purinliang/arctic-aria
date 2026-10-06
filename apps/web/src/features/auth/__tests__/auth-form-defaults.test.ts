import assert from "node:assert/strict";
import test from "node:test";
import { demoLoginInput, emptyLogin, emptyRegister } from "../auth-form-defaults.ts";
import { validateLoginSubmit } from "../validation.ts";

test("demo credentials are valid without prepopulating personal auth forms", () => {
  assert.deepEqual(demoLoginInput, {
    username: "demo",
    password: "demo123456+",
  });
  assert.deepEqual(emptyLogin, { username: "", password: "" });
  assert.equal(emptyRegister.password, "");
  assert.deepEqual(validateLoginSubmit(demoLoginInput), {});
});
