import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../database/neon.ts";

type Sql = NeonQueryFunction<false, false>;

export type DiscordBindingStatus = "active" | "revoked";

export type DiscordAccountRecord = {
  id: string;
  userId: string;
  discordUserId: string;
  discordUsername: string | null;
  dmChannelId: string | null;
  bindingStatus: DiscordBindingStatus;
  lastInteractionAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  revokedAt: Date | null;
};

export type UpsertOwnerDiscordBindingInput = {
  userId: string;
  discordUserId: string;
  discordUsername?: string | null;
  dmChannelId?: string | null;
  occurredAt: Date;
};

type DiscordAccountRow = {
  id: string;
  user_id: string;
  discord_user_id: string;
  discord_username: string | null;
  dm_channel_id: string | null;
  binding_status: string;
  last_interaction_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  revoked_at: Date | string | null;
};

function mapDiscordAccount(row: DiscordAccountRow): DiscordAccountRecord {
  return {
    id: row.id,
    userId: row.user_id,
    discordUserId: row.discord_user_id,
    discordUsername: row.discord_username,
    dmChannelId: row.dm_channel_id,
    bindingStatus: row.binding_status as DiscordBindingStatus,
    lastInteractionAt: row.last_interaction_at
      ? new Date(row.last_interaction_at)
      : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : null,
  };
}

export class PostgresDiscordAccountRepository {
  private readonly sql?: Sql;

  constructor(sql?: Sql) {
    this.sql = sql;
  }

  async findActiveByDiscordUserId(discordUserId: string) {
    const rows = (await this.getSql().query(
      `SELECT
         id,
         user_id,
         discord_user_id,
         discord_username,
         dm_channel_id,
         binding_status,
         last_interaction_at,
         created_at,
         updated_at,
         revoked_at
       FROM discord_accounts
       WHERE discord_user_id = $1
         AND binding_status = 'active'
       LIMIT 1`,
      [discordUserId],
    )) as DiscordAccountRow[];

    return rows[0] ? mapDiscordAccount(rows[0]) : null;
  }

  async upsertOwnerBinding(input: UpsertOwnerDiscordBindingInput) {
    const rows = (await this.getSql().query(
      `INSERT INTO discord_accounts (
         user_id,
         discord_user_id,
         discord_username,
         dm_channel_id,
         binding_status,
         last_interaction_at,
         created_at,
         updated_at,
         revoked_at
       )
       VALUES ($1, $2, $3, $4, 'active', $5, $5, $5, NULL)
       ON CONFLICT (user_id) DO UPDATE SET
         discord_user_id = EXCLUDED.discord_user_id,
         discord_username = EXCLUDED.discord_username,
         dm_channel_id = EXCLUDED.dm_channel_id,
         binding_status = 'active',
         last_interaction_at = EXCLUDED.last_interaction_at,
         updated_at = EXCLUDED.updated_at,
         revoked_at = NULL
       RETURNING
         id,
         user_id,
         discord_user_id,
         discord_username,
         dm_channel_id,
         binding_status,
         last_interaction_at,
         created_at,
         updated_at,
         revoked_at`,
      [
        input.userId,
        input.discordUserId,
        input.discordUsername ?? null,
        input.dmChannelId ?? null,
        input.occurredAt,
      ],
    )) as DiscordAccountRow[];

    return mapDiscordAccount(rows[0]);
  }

  private getSql() {
    return this.sql ?? getSql();
  }
}
