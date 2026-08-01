import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import type {
  CancelEventInstanceInput,
  EventRepository,
  SaveEventGroupInput,
  SaveEventInput,
  UpdateEventInstanceInput,
} from "./event-repository.ts";
import {
  eventInstanceSelect,
  eventInstanceSelectFromCte,
  eventParams,
  eventSelect,
  eventSelectFromCtes,
  mapEvent,
  mapEventGroup,
  mapEventInstance,
  type EventGroupRow,
  type EventInstanceRow,
  type EventRow,
} from "./postgres-event-mappers.ts";

export class PostgresEventRepository implements EventRepository {
  private readonly sql?: NeonQueryFunction<false, false>;

  constructor(sql?: NeonQueryFunction<false, false>) {
    this.sql = sql;
  }

  private getSql() {
    return this.sql ?? getSql();
  }

  async listEventGroups(userId: string) {
    const rows = (await this.getSql().query(
      `
      SELECT
        id,
        user_id,
        name,
        description,
        created_at,
        updated_at,
        deleted_at
      FROM event_groups
      WHERE user_id = $1
        AND deleted_at IS NULL
      ORDER BY name ASC, created_at ASC
      `,
      [userId],
    )) as EventGroupRow[];

    return rows.map(mapEventGroup);
  }

  async listEvents(userId: string) {
    const rows = (await this.getSql().query(
      `${eventSelect}
       WHERE events.user_id = $1
         AND events.deleted_at IS NULL
       ORDER BY
         events.start_date ASC,
         event_rules.scheduled_time ASC,
         events.created_at ASC`,
      [userId],
    )) as EventRow[];

    return rows.map(mapEvent);
  }

  async listActiveEvents(userId: string) {
    return this.listEvents(userId);
  }

  async listEventInstances(userId: string) {
    const rows = (await this.getSql().query(
      `${eventInstanceSelect}
       WHERE event_instances.user_id = $1
         AND event_instances.status != 'canceled'
         AND events.deleted_at IS NULL
       ORDER BY
         event_instances.scheduled_date ASC,
         event_instances.scheduled_time ASC,
         event_instances.created_at ASC`,
      [userId],
    )) as EventInstanceRow[];

    return rows.map(mapEventInstance);
  }

  async listEventInstancesForDate(userId: string, scheduledDate: string) {
    const rows = (await this.getSql().query(
      `${eventInstanceSelect}
       WHERE event_instances.user_id = $1
         AND event_instances.scheduled_date = $2::date
         AND event_instances.status != 'canceled'
         AND events.deleted_at IS NULL
       ORDER BY event_instances.scheduled_time ASC, event_instances.created_at ASC`,
      [userId, scheduledDate],
    )) as EventInstanceRow[];

    return rows.map(mapEventInstance);
  }

  async createEventGroup(input: SaveEventGroupInput) {
    const rows = (await this.getSql().query(
      `
      INSERT INTO event_groups (
        user_id,
        name,
        description,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $4)
      RETURNING
        id,
        user_id,
        name,
        description,
        created_at,
        updated_at,
        deleted_at
      `,
      [input.userId, input.name, input.description, input.occurredAt],
    )) as EventGroupRow[];

    return mapEventGroup(rows[0]);
  }

  async updateEventGroup(input: SaveEventGroupInput & { groupId: string }) {
    const rows = (await this.getSql().query(
      `
      UPDATE event_groups
      SET name = $3,
          description = $4,
          updated_at = $5
      WHERE user_id = $1
        AND id = $2
        AND deleted_at IS NULL
      RETURNING
        id,
        user_id,
        name,
        description,
        created_at,
        updated_at,
        deleted_at
      `,
      [
        input.userId,
        input.groupId,
        input.name,
        input.description,
        input.occurredAt,
      ],
    )) as EventGroupRow[];

    return rows[0] ? mapEventGroup(rows[0]) : null;
  }

  async deleteEventGroup(input: {
    userId: string;
    groupId: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `
      WITH target_group AS (
        UPDATE event_groups
        SET deleted_at = $3,
            updated_at = $3
        WHERE user_id = $1
          AND id = $2
          AND deleted_at IS NULL
        RETURNING id
      ),
      cleared_events AS (
        UPDATE events
        SET group_id = NULL,
            updated_at = $3
        WHERE user_id = $1
          AND group_id IN (SELECT id FROM target_group)
          AND deleted_at IS NULL
        RETURNING id
      )
      SELECT id FROM target_group
      `,
      [input.userId, input.groupId, input.occurredAt],
    )) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async createEvent(input: SaveEventInput) {
    const rows = (await this.getSql().query(
      `
      WITH valid_group AS (
        SELECT id
        FROM event_groups
        WHERE user_id = $1
          AND id = $13::uuid
          AND deleted_at IS NULL
        LIMIT 1
      ),
      inserted_event AS (
        INSERT INTO events (
          user_id,
          group_id,
          title,
          description,
          start_date,
          end_date,
          estimated_duration_hours,
          location,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          (SELECT id FROM valid_group),
          $2,
          $3,
          $4::date,
          $5::date,
          $6,
          $7,
          $12,
          $12
        )
        RETURNING *
      ),
      inserted_rule AS (
        INSERT INTO event_rules (
          event_id,
          rule_type,
          scheduled_time,
          weekday,
          timezone,
          created_at,
          updated_at
        )
        SELECT id, $8, $9::time, $10::int, $11, $12, $12
        FROM inserted_event
        RETURNING *
      )
      ${eventSelectFromCtes("inserted_event", "inserted_rule")}
      `,
      eventParams(input),
    )) as EventRow[];

    return mapEvent(rows[0]);
  }

  async updateEvent(input: SaveEventInput & { eventId: string }) {
    const rows = (await this.getSql().query(
      `
      WITH valid_group AS (
        SELECT id
        FROM event_groups
        WHERE user_id = $1
          AND id = $13::uuid
          AND deleted_at IS NULL
        LIMIT 1
      ),
      updated_event AS (
        UPDATE events
        SET
          group_id = CASE
            WHEN $13::uuid IS NULL THEN NULL
            ELSE (SELECT id FROM valid_group)
          END,
          title = $2,
          description = $3,
          start_date = $4::date,
          end_date = $5::date,
          estimated_duration_hours = $6,
          location = $7,
          updated_at = $12
        WHERE user_id = $1
          AND id = $14
          AND deleted_at IS NULL
        RETURNING *
      ),
      updated_rule AS (
        UPDATE event_rules
        SET
          rule_type = $8,
          scheduled_time = $9::time,
          weekday = $10::int,
          timezone = $11,
          updated_at = $12
        FROM updated_event
        WHERE event_rules.event_id = updated_event.id
        RETURNING event_rules.*
      )
      ${eventSelectFromCtes("updated_event", "updated_rule")}
      `,
      [...eventParams(input), input.eventId],
    )) as EventRow[];

    return rows[0] ? mapEvent(rows[0]) : null;
  }

  async deleteEvent(input: {
    userId: string;
    eventId: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `
      UPDATE events
      SET deleted_at = $3,
          updated_at = $3
      WHERE user_id = $1
        AND id = $2
        AND deleted_at IS NULL
      RETURNING id
      `,
      [input.userId, input.eventId, input.occurredAt],
    )) as Array<{ id: string }>;

    return rows.length > 0;
  }

  async ensureEventInstance(input: {
    userId: string;
    eventId: string;
    ruleDate: string;
    ruleTime: string;
    scheduledDate: string;
    scheduledTime: string;
    occurredAt: Date;
  }) {
    const rows = (await this.getSql().query(
      `
      WITH target AS (
        SELECT id, user_id
        FROM events
        WHERE id = $2
          AND user_id = $1
          AND deleted_at IS NULL
        LIMIT 1
      ),
      existing_instance AS (
        SELECT event_instances.*
        FROM event_instances
        INNER JOIN target ON target.id = event_instances.event_id
        WHERE event_instances.rule_date = $3::date
          AND event_instances.rule_time = $4::time
        LIMIT 1
      ),
      inserted_instance AS (
        INSERT INTO event_instances (
          user_id,
          event_id,
          rule_date,
          rule_time,
          scheduled_date,
          scheduled_time,
          created_at,
          updated_at
        )
        SELECT user_id, id, $3, $4, $5, $6, $7, $7
        FROM target
        WHERE NOT EXISTS (SELECT 1 FROM existing_instance)
        ON CONFLICT DO NOTHING
        RETURNING *
      ),
      selected_instance AS (
        SELECT * FROM inserted_instance
        UNION ALL
        SELECT * FROM existing_instance
        WHERE NOT EXISTS (SELECT 1 FROM inserted_instance)
        LIMIT 1
      )
      ${eventInstanceSelectFromCte("selected_instance")}
      `,
      [
        input.userId,
        input.eventId,
        input.ruleDate,
        input.ruleTime,
        input.scheduledDate,
        input.scheduledTime,
        input.occurredAt,
      ],
    )) as EventInstanceRow[];

    return rows[0] ? mapEventInstance(rows[0]) : null;
  }

  async updateEventInstance(input: UpdateEventInstanceInput) {
    const rows = (await this.getSql().query(
      `
      WITH updated_instance AS (
        UPDATE event_instances
        SET
          scheduled_date = $3::date,
          scheduled_time = $4::time,
          location_override = $5,
          rescheduled_at = CASE
            WHEN scheduled_date != $3::date
              OR scheduled_time != $4::time
            THEN $7
            ELSE rescheduled_at
          END,
          reschedule_reason = CASE
            WHEN scheduled_date != $3::date
              OR scheduled_time != $4::time
            THEN $6
            ELSE reschedule_reason
          END,
          updated_at = $7
        WHERE user_id = $1
          AND id = $2
          AND status = 'scheduled'
          AND EXISTS (
            SELECT 1
            FROM events
            WHERE events.id = event_instances.event_id
              AND events.user_id = $1
              AND events.deleted_at IS NULL
          )
        RETURNING *
      )
      ${eventInstanceSelectFromCte("updated_instance")}
      `,
      [
        input.userId,
        input.instanceId,
        input.scheduledDate,
        input.scheduledTime,
        input.locationOverride,
        input.rescheduleReason,
        input.occurredAt,
      ],
    )) as EventInstanceRow[];

    return rows[0] ? mapEventInstance(rows[0]) : null;
  }

  async cancelEventInstance(input: CancelEventInstanceInput) {
    const rows = (await this.getSql().query(
      `
      WITH canceled_instance AS (
        UPDATE event_instances
        SET
          status = 'canceled',
          canceled_at = $4,
          cancellation_reason = $3,
          updated_at = $4
        WHERE user_id = $1
          AND id = $2
          AND status = 'scheduled'
          AND EXISTS (
            SELECT 1
            FROM events
            WHERE events.id = event_instances.event_id
              AND events.user_id = $1
              AND events.deleted_at IS NULL
          )
        RETURNING *
      )
      ${eventInstanceSelectFromCte("canceled_instance")}
      `,
      [
        input.userId,
        input.instanceId,
        input.cancellationReason,
        input.occurredAt,
      ],
    )) as EventInstanceRow[];

    return rows[0] ? mapEventInstance(rows[0]) : null;
  }

  async deleteFutureScheduledEventInstances(input: {
    userId: string;
    eventId: string;
    fromDate: string;
  }) {
    const rows = (await this.getSql().query(
      `
      DELETE FROM event_instances
      WHERE user_id = $1
        AND event_id = $2
        AND scheduled_date >= $3::date
        AND status = 'scheduled'
        AND canceled_at IS NULL
        AND rescheduled_at IS NULL
        AND location_override IS NULL
      RETURNING id
      `,
      [input.userId, input.eventId, input.fromDate],
    )) as Array<{ id: string }>;

    return rows.length;
  }
}
