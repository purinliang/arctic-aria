import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";
import { verifyDiscordRequestSignature } from "../server/signature.ts";

test("discord signature verification accepts a signed request body", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const body = Buffer.from('{"type":1}', "utf8");
  const timestamp = "1760000000";
  const payload = Buffer.concat([Buffer.from(timestamp, "utf8"), body]);
  const signature = sign(null, payload, privateKey).toString("hex");
  const publicKeyHex = Buffer.from(
    publicKey.export({ format: "der", type: "spki" }),
  )
    .subarray(-32)
    .toString("hex");

  assert.equal(
    verifyDiscordRequestSignature({
      body,
      publicKey: publicKeyHex,
      signature,
      timestamp,
    }),
    true,
  );
});

test("discord signature verification rejects changed request bodies", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const body = Buffer.from('{"type":1}', "utf8");
  const timestamp = "1760000000";
  const payload = Buffer.concat([Buffer.from(timestamp, "utf8"), body]);
  const signature = sign(null, payload, privateKey).toString("hex");
  const publicKeyHex = Buffer.from(
    publicKey.export({ format: "der", type: "spki" }),
  )
    .subarray(-32)
    .toString("hex");

  assert.equal(
    verifyDiscordRequestSignature({
      body: Buffer.from('{"type":2}', "utf8"),
      publicKey: publicKeyHex,
      signature,
      timestamp,
    }),
    false,
  );
});
