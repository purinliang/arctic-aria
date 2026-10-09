import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export class CredentialEncryptionError extends Error {
  constructor() { super("AI credential encryption unavailable."); }
}

function encryptionKey(env: Record<string, string | undefined>) {
  const value = env.AI_CREDENTIAL_ENCRYPTION_KEY ?? "";
  if (typeof window !== "undefined" || !/^[A-Za-z0-9+/]{43}=$/.test(value)) {
    throw new CredentialEncryptionError();
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32 || key.toString("base64") !== value) throw new CredentialEncryptionError();
  return key;
}

export function createCredentialEncryption(env: Record<string, string | undefined> = process.env) {
  const context = (userId: string) => Buffer.from(`v1:google_gemini:${userId}`, "utf8");
  return {
    encrypt(userId: string, plaintext: string) {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", encryptionKey(env), iv);
      cipher.setAAD(context(userId));
      const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
      return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join(":");
    },
    decrypt(userId: string, envelope: string) {
      try {
        const [version, iv, tag, ciphertext, extra] = envelope.split(":");
        if (version !== "v1" || extra !== undefined || !iv || !tag || !ciphertext) throw new CredentialEncryptionError();
        const nonce = Buffer.from(iv, "base64"), authTag = Buffer.from(tag, "base64");
        if (nonce.length !== 12 || authTag.length !== 16) throw new CredentialEncryptionError();
        const decipher = createDecipheriv("aes-256-gcm", encryptionKey(env), nonce);
        decipher.setAAD(context(userId));
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
      } catch { throw new CredentialEncryptionError(); }
    },
  };
}
