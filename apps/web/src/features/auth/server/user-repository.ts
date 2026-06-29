export type UserRecord = {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
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
};

export class InMemoryUserRepository implements UserRepository {
  private users: UserRecord[] = [];

  async create(input: CreateUserRecord) {
    const now = new Date();
    const user: UserRecord = {
      id: crypto.randomUUID(),
      username: input.username,
      displayName: input.displayName,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(user);

    return user;
  }

  async findByUsername(username: string) {
    return this.users.find((user) => user.username === username) ?? null;
  }

  clear() {
    this.users = [];
  }
}

export const authUserRepository = new InMemoryUserRepository();
