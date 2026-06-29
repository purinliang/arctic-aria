import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import type {
  CreateUserRecord,
  UserRecord,
  UserRepository,
} from "./user-repository.ts";
import { DuplicateUsernameError } from "./user-repository.ts";

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

function isUniqueUsernameViolation(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    constraint?: unknown;
    message?: unknown;
  };
  const constraint = String(candidate.constraint ?? "");
  const message = String(candidate.message ?? "");

  return (
    candidate.code === "23505" &&
    (constraint.includes("username") || message.includes("users_username"))
  );
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
    let rows: UserRow[];

    try {
      rows = (await this.getSql()`
        INSERT INTO users (username, display_name, password_hash)
        VALUES (${input.username}, ${input.displayName}, ${input.passwordHash})
        RETURNING id, username, display_name, password_hash, created_at, updated_at
      `) as UserRow[];
    } catch (error) {
      if (isUniqueUsernameViolation(error)) {
        throw new DuplicateUsernameError(input.username);
      }

      throw error;
    }

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
