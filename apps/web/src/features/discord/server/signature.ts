import { createPublicKey, verify } from "node:crypto";

const ed25519SpkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
const hexPattern = /^[0-9a-f]+$/i;

export function verifyDiscordRequestSignature(input: {
  body: Buffer;
  publicKey: string;
  signature: string;
  timestamp: string;
}) {
  if (!isHex(input.publicKey, 64) || !isHex(input.signature, 128)) {
    return false;
  }

  try {
    const key = createPublicKey({
      key: Buffer.concat([
        ed25519SpkiPrefix,
        Buffer.from(input.publicKey, "hex"),
      ]),
      format: "der",
      type: "spki",
    });
    const signedPayload = Buffer.concat([
      Buffer.from(input.timestamp, "utf8"),
      input.body,
    ]);

    return verify(
      null,
      signedPayload,
      key,
      Buffer.from(input.signature, "hex"),
    );
  } catch {
    return false;
  }
}

function isHex(value: string, length: number) {
  return value.length === length && hexPattern.test(value);
}
