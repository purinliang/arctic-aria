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

export type DiscordDailyReviewTarget = {
  userId: string;
  timeZonePreference: string;
};

export type CreateDiscordBindingCodeInput = {
  userId: string;
  codeHash: string;
  expiresAt: Date;
  createdAt: Date;
};

export type RedeemDiscordBindingCodeInput = {
  codeHash: string;
  discordUserId: string;
  discordUsername: string | null;
  dmChannelId: string | null;
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

type DiscordDailyReviewTargetRow = {
  user_id: string;
  timezone_preference: string | null;
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

  async findActiveByUserId(userId: string) {
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
       WHERE user_id = $1
         AND binding_status = 'active'
       LIMIT 1`,
      [userId],
    )) as DiscordAccountRow[];

    return rows[0] ? mapDiscordAccount(rows[0]) : null;
  }

  async listActiveDailyReviewTargets(): Promise<DiscordDailyReviewTarget[]> {
    const rows = (await this.getSql().query(
      `SELECT
         discord_accounts.user_id,
         user_settings.timezone_preference
       FROM discord_accounts
       LEFT JOIN user_settings
         ON user_settings.user_id = discord_accounts.user_id
       WHERE discord_accounts.binding_status = 'active'
       ORDER BY discord_accounts.created_at`,
      [],
    )) as DiscordDailyReviewTargetRow[];

    return rows.map((row) => ({
      userId: row.user_id,
      timeZonePreference: row.timezone_preference ?? "system",
    }));
  }

  async createBindingCode(input: CreateDiscordBindingCodeInput) {
    await this.getSql().query(
      `WITH canceled_codes AS (
         UPDATE discord_binding_codes
         SET consumed_at = $4
         WHERE user_id = $1
           AND consumed_at IS NULL
         RETURNING id
       )
       INSERT INTO discord_binding_codes (
         user_id,
         code_hash,
         expires_at,
         created_at
       )
       VALUES ($1, $2, $3, $4)`,
      [input.userId, input.codeHash, input.expiresAt, input.createdAt],
    );
  }

  async redeemBindingCode(input: RedeemDiscordBindingCodeInput) {
    const rows = (await this.getSql().query(
      `WITH valid_code AS (
         SELECT id, user_id
         FROM discord_binding_codes
         WHERE code_hash = $1
           AND consumed_at IS NULL
           AND expires_at > $5
         ORDER BY created_at DESC
         LIMIT 1
       ),
       consumed_code AS (
         UPDATE discord_binding_codes
         SET consumed_at = $5
         WHERE id IN (SELECT id FROM valid_code)
         RETURNING user_id
       )
       INSERT INTO discord_accounts (
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
       SELECT
         user_id,
         $2,
         $3,
         $4,
         'active',
         $5,
         $5,
         $5,
         NULL
       FROM consumed_code
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
        input.codeHash,
        input.discordUserId,
        input.discordUsername,
        input.dmChannelId,
        input.occurredAt,
      ],
    )) as DiscordAccountRow[];

    return rows[0] ? mapDiscordAccount(rows[0]) : null;
  }

  async cancelBindingCodesByUserId(userId: string, canceledAt: Date) {
    await this.getSql().query(
      `UPDATE discord_binding_codes
       SET consumed_at = $2
       WHERE user_id = $1
         AND consumed_at IS NULL`,
      [userId, canceledAt],
    );
  }

  async revokeActiveByUserId(userId: string, revokedAt: Date) {
    const rows = (await this.getSql().query(
      `UPDATE discord_accounts
       SET binding_status = 'revoked',
           revoked_at = $2,
           updated_at = $2
       WHERE user_id = $1
         AND binding_status = 'active'
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
      [userId, revokedAt],
    )) as DiscordAccountRow[];

    return rows[0] ? mapDiscordAccount(rows[0]) : null;
  }

  async recordInteraction(input: {
    discordUserId: string;
    discordUsername: string | null;
    dmChannelId: string | null;
    occurredAt: Date;
  }) {
    await this.getSql().query(
      `UPDATE discord_accounts
       SET last_interaction_at = $2,
           discord_username = COALESCE($3, discord_username),
           dm_channel_id = COALESCE($4, dm_channel_id),
           updated_at = $2
       WHERE discord_user_id = $1
         AND binding_status = 'active'`,
      [
        input.discordUserId,
        input.occurredAt,
        input.discordUsername,
        input.dmChannelId,
      ],
    );
  }

  private getSql() {
    return this.sql ?? getSql();
  }
}
