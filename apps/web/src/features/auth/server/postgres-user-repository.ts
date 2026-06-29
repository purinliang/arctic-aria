import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import type {
  CreateUserRecord,
  UserRecord,
  UserRepository,
} from "./user-repository.ts";

type UserRow = {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  created_at: Date | string;
  updated_at: Date | string;
};

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    passwordHash: row.password_hash,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class PostgresUserRepository implements UserRepository {
  private readonly sql?: NeonQueryFunction<false, false>;

  constructor(sql?: NeonQueryFunction<false, false>) {
    this.sql = sql;
  }

  private getSql() {
    return this.sql ?? getSql();
  }

  async create(input: CreateUserRecord) {
    const rows = (await this.getSql()`
      INSERT INTO users (username, display_name, password_hash)
      VALUES (${input.username}, ${input.displayName}, ${input.passwordHash})
      RETURNING id, username, display_name, password_hash, created_at, updated_at
    `) as UserRow[];
    const [row] = rows;

    return mapUser(row);
  }

  async findByUsername(username: string) {
    const rows = (await this.getSql()`
      SELECT id, username, display_name, password_hash, created_at, updated_at
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `) as UserRow[];
    const [row] = rows;

    return row ? mapUser(row) : null;
  }
}
