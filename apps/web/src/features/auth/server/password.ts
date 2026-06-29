import bcrypt from "bcryptjs";

export type PasswordHasher = {
  hash(password: string): Promise<string>;
  verify(password: string, passwordHash: string): Promise<boolean>;
};

export const bcryptPasswordHasher: PasswordHasher = {
  async hash(password) {
    return bcrypt.hash(password, 12);
  },
  async verify(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
  },
};
