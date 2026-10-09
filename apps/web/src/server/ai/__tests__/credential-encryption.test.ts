import assert from "node:assert/strict";
import test from "node:test";
import { createCredentialEncryption, CredentialEncryptionError } from "../credential-encryption.ts";

const env = { AI_CREDENTIAL_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64") };
const key = "test-user-api-key";

test("AI credentials round-trip with randomized ciphertext bound to their owner", () => {
  const crypto = createCredentialEncryption(env);
  const a = crypto.encrypt("account-a", key), b = crypto.encrypt("account-a", key);
  assert.notEqual(a, b);
  assert.ok(!a.includes(key));
  assert.equal(crypto.decrypt("account-a", a), key);
  assert.throws(() => crypto.decrypt("account-b", a), CredentialEncryptionError);
  const pieces = a.split(":"); pieces[2] = Buffer.alloc(16).toString("base64");
  assert.throws(() => crypto.decrypt("account-a", pieces.join(":")), CredentialEncryptionError);
});

test("AI credential encryption rejects missing, malformed, or changed server secrets", () => {
  for (const value of [undefined, "", "invalid", Buffer.alloc(16).toString("base64")]) {
    const crypto = createCredentialEncryption({ AI_CREDENTIAL_ENCRYPTION_KEY: value });
    assert.throws(() => crypto.encrypt("account-a", key), CredentialEncryptionError);
  }
  const ciphertext = createCredentialEncryption(env).encrypt("account-a", key);
  const changed = createCredentialEncryption({ AI_CREDENTIAL_ENCRYPTION_KEY: Buffer.alloc(32, 8).toString("base64") });
  assert.throws(() => changed.decrypt("account-a", ciphertext), CredentialEncryptionError);
  assert.throws(() => changed.decrypt("account-a", "v1:invalid"), CredentialEncryptionError);
});
