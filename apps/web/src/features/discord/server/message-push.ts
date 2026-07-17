import { createHash } from "node:crypto";
import type { DiscordMessageSender } from "./discord-api.ts";
import type { QueryExecutor } from "./query.ts";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sourceValues = new Set(["web", "scheduler", "manual", "agent"]);
const textMaxLength = 2000;
const idempotencyKeyMaxLength = 160;

export type OutboundMessageResult = {
  status: number;
  body: Record<string, unknown>;
  log: {
    deliveryId?: string;
    status: number;
  };
};

type OutboundMessageInput = {
  userId: string;
  idempotencyKey: string;
  text: string;
  source: string;
  metadata: Record<string, unknown>;
};

type DiscordAccountRow = {
  id: string;
  discord_user_id: string;
  dm_channel_id: string | null;
};

type DeliveryRow = {
  id: string;
  content_hash: string;
  delivery_status: string;
  discord_message_id: string | null;
  error_code: string | null;
};

export async function handleOutboundDiscordMessage(
  sql: QueryExecutor,
  rawInput: unknown,
  sender: DiscordMessageSender,
  occurredAt = new Date(),
): Promise<OutboundMessageResult> {
  const input = validateOutboundMessageInput(rawInput);

  if (!input.ok) {
    return result(input.status, { error: input.message });
  }

  const binding = await findActiveDiscordBinding(sql, input.value.userId);

  if (!binding) {
    return result(404, { error: "No active Discord binding." });
  }

  const contentHash = hashMessageContent(input.value);
  const delivery = await createOrLoadDelivery(sql, {
    binding,
    contentHash,
    input: input.value,
    occurredAt,
  });

  if (delivery.kind === "conflict") {
    return result(409, {
      error: "Idempotency key reused for different content.",
    });
  }

  if (delivery.kind === "existing") {
    return result(
      delivery.row.delivery_status === "failed" ? 502 : 200,
      deliveryResponseBody(delivery.row),
      delivery.row.id,
    );
  }

  try {
    const sent = await sender.sendDirectMessage({
      discordUserId: binding.discord_user_id,
      dmChannelId: binding.dm_channel_id,
      text: input.value.text,
    });

    const sentRow = await markDeliverySent(sql, {
      deliveryId: delivery.row.id,
      discordAccountId: binding.id,
      discordMessageId: sent.discordMessageId,
      dmChannelId: sent.dmChannelId,
      occurredAt,
    });

    return result(200, deliveryResponseBody(sentRow), sentRow.id);
  } catch (error) {
    const failedRow = await markDeliveryFailed(sql, {
      deliveryId: delivery.row.id,
      errorCode: readSafeErrorCode(error),
      occurredAt,
    });

    return result(502, deliveryResponseBody(failedRow), failedRow.id);
  }
}

function validateOutboundMessageInput(rawInput: unknown):
  | { ok: true; value: OutboundMessageInput }
  | { ok: false; status: number; message: string } {
  if (!rawInput || typeof rawInput !== "object") {
    return invalid("Request body must be an object.");
  }

  const input = rawInput as Record<string, unknown>;
  const userId = readTrimmedString(input.userId);
  const idempotencyKey = readTrimmedString(input.idempotencyKey);
  const text = readTrimmedString(input.text);
  const source = readTrimmedString(input.source);
  const metadata = isPlainObject(input.metadata) ? input.metadata : {};

  if (!userId || !uuidPattern.test(userId)) {
    return invalid("userId must be a valid Arctic Aria user id.");
  }

  if (!idempotencyKey || idempotencyKey.length > idempotencyKeyMaxLength) {
    return invalid("idempotencyKey must be 1 to 160 characters.");
  }

  if (!text || text.length > textMaxLength) {
    return invalid("text must be 1 to 2000 characters.");
  }

  if (!sourceValues.has(source)) {
    return invalid("source must be web, scheduler, manual, or agent.");
  }

  return {
    ok: true,
    value: {
      userId,
      idempotencyKey,
      text,
      source,
      metadata,
    },
  };
}

function invalid(message: string) {
  return {
    ok: false as const,
    status: 400,
    message,
  };
}

async function findActiveDiscordBinding(sql: QueryExecutor, userId: string) {
  const rows = (await sql.query(
    `SELECT id, discord_user_id, dm_channel_id
     FROM discord_accounts
     WHERE user_id = $1
       AND binding_status = 'active'
     LIMIT 1`,
    [userId],
  )) as DiscordAccountRow[];

  return rows[0] ?? null;
}

async function createOrLoadDelivery(
  sql: QueryExecutor,
  input: {
    binding: DiscordAccountRow;
    contentHash: string;
    input: OutboundMessageInput;
    occurredAt: Date;
  },
) {
  const insertedRows = (await sql.query(
    `INSERT INTO discord_message_deliveries (
       user_id,
       discord_account_id,
       idempotency_key,
       content_hash,
       source,
       metadata,
       delivery_status,
       created_at
     )
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'pending', $7)
     ON CONFLICT (user_id, idempotency_key) DO NOTHING
     RETURNING id, content_hash, delivery_status, discord_message_id, error_code`,
    [
      input.input.userId,
      input.binding.id,
      input.input.idempotencyKey,
      input.contentHash,
      input.input.source,
      JSON.stringify(input.input.metadata),
      input.occurredAt,
    ],
  )) as DeliveryRow[];

  if (insertedRows[0]) {
    return { kind: "created" as const, row: insertedRows[0] };
  }

  const existingRows = (await sql.query(
    `SELECT id, content_hash, delivery_status, discord_message_id, error_code
     FROM discord_message_deliveries
     WHERE user_id = $1
       AND idempotency_key = $2
     LIMIT 1`,
    [input.input.userId, input.input.idempotencyKey],
  )) as DeliveryRow[];
  const existing = existingRows[0];

  if (!existing || existing.content_hash !== input.contentHash) {
    return { kind: "conflict" as const };
  }

  return { kind: "existing" as const, row: existing };
}

async function markDeliverySent(
  sql: QueryExecutor,
  input: {
    deliveryId: string;
    discordAccountId: string;
    discordMessageId: string | null;
    dmChannelId: string | null;
    occurredAt: Date;
  },
) {
  const rows = (await sql.query(
    `WITH updated_delivery AS (
       UPDATE discord_message_deliveries
       SET delivery_status = 'sent',
           discord_message_id = $2,
           sent_at = $3
       WHERE id = $1
       RETURNING id, content_hash, delivery_status, discord_message_id, error_code
     )
     UPDATE discord_accounts
     SET dm_channel_id = COALESCE($5, dm_channel_id),
         updated_at = $3
     WHERE id = $4
     RETURNING (
       SELECT id FROM updated_delivery
     ) AS id,
     (
       SELECT content_hash FROM updated_delivery
     ) AS content_hash,
     (
       SELECT delivery_status FROM updated_delivery
     ) AS delivery_status,
     (
       SELECT discord_message_id FROM updated_delivery
     ) AS discord_message_id,
     (
       SELECT error_code FROM updated_delivery
     ) AS error_code`,
    [
      input.deliveryId,
      input.discordMessageId,
      input.occurredAt,
      input.discordAccountId,
      input.dmChannelId,
    ],
  )) as DeliveryRow[];

  return rows[0];
}

async function markDeliveryFailed(
  sql: QueryExecutor,
  input: {
    deliveryId: string;
    errorCode: string;
    occurredAt: Date;
  },
) {
  const rows = (await sql.query(
    `UPDATE discord_message_deliveries
     SET delivery_status = 'failed',
         error_code = $2,
         failed_at = $3
     WHERE id = $1
     RETURNING id, content_hash, delivery_status, discord_message_id, error_code`,
    [input.deliveryId, input.errorCode, input.occurredAt],
  )) as DeliveryRow[];

  return rows[0];
}

function result(
  status: number,
  body: Record<string, unknown>,
  deliveryId?: string,
): OutboundMessageResult {
  return {
    status,
    body,
    log: {
      deliveryId,
      status,
    },
  };
}

function deliveryResponseBody(row: DeliveryRow) {
  return {
    deliveryId: row.id,
    status: row.delivery_status,
    discordMessageId: row.discord_message_id,
    errorCode: row.error_code,
  };
}

function hashMessageContent(input: OutboundMessageInput) {
  return createHash("sha256")
    .update(input.text)
    .update("\0")
    .update(input.source)
    .update("\0")
    .update(stableJson(input.metadata))
    .digest("hex");
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function readTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value),
  );
}

function readSafeErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    return String(error.code).slice(0, 80);
  }

  return "discord_send_failed";
}
