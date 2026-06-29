import { createHash } from "node:crypto";

export type PasswordHasher = {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
};

function prototypeHash(password: string) {
  return createHash("sha256").update(password).digest("base64url");
}

export const prototypePasswordHasher: PasswordHasher = {
  async hash(password) {
    return `prototype-bcrypt:${prototypeHash(password)}`;
  },
  async verify(password, passwordHash) {
    return passwordHash === `prototype-bcrypt:${prototypeHash(password)}`;
  },
};
