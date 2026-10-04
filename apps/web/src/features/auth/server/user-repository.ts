export type UserRecord = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserRecord = {
  username: string;
  displayName: string;
  passwordHash: string;
};

export type UserRepository = {
  create(input: CreateUserRecord): Promise<UserRecord>;
  findByUsername(username: string): Promise<UserRecord | null>;
  findById(userId: string): Promise<UserRecord | null>;
  replacePasswordHash(input: {
    userId: string;
    expectedPasswordHash: string;
    passwordHash: string;
  }): Promise<boolean>;
};

export class DuplicateUsernameError extends Error {
  constructor(username: string) {
    super(`Username already exists: ${username}`);
    this.name = "DuplicateUsernameError";
  }
}

export class InMemoryUserRepository implements UserRepository {
  private users: UserRecord[] = [];

  async create(input: CreateUserRecord) {
    if (this.users.some((user) => user.username === input.username)) {
      throw new DuplicateUsernameError(input.username);
    }

    const now = new Date();
    const user: UserRecord = {
      id: crypto.randomUUID(),
      username: input.username,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      isAdmin: false,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(user);

    return user;
  }

  async findByUsername(username: string) {
    return this.users.find((user) => user.username === username) ?? null;
  }

  async findById(userId: string) {
    return this.users.find((user) => user.id === userId) ?? null;
  }

  async replacePasswordHash(input: {
    userId: string;
    expectedPasswordHash: string;
    passwordHash: string;
  }) {
    const user = this.users.find(
      (current) => current.id === input.userId && current.passwordHash === input.expectedPasswordHash,
    );
    if (!user) return false;
    user.passwordHash = input.passwordHash;
    user.updatedAt = new Date();
    return true;
  }

  clear() {
    this.users = [];
  }
}

export const authUserRepository = new InMemoryUserRepository();
