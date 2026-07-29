import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import type {
  EventRepository,
  SaveEventInput,
} from "./event-repository.ts";
import {
  eventParams,
  eventSelect,
  mapEvent,
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

  async listEvents(userId: string) {
    const rows = (await this.getSql().query(
      `${eventSelect}
       WHERE user_id = $1
         AND deleted_at IS NULL
       ORDER BY event_date ASC, event_time ASC, created_at ASC`,
      [userId],
    )) as EventRow[];

    return rows.map(mapEvent);
  }

  async listEventsForDate(userId: string, eventDate: string) {
    const rows = (await this.getSql().query(
      `${eventSelect}
       WHERE user_id = $1
         AND event_date = $2::date
         AND deleted_at IS NULL
       ORDER BY event_time ASC, created_at ASC`,
      [userId, eventDate],
    )) as EventRow[];

    return rows.map(mapEvent);
  }

  async createEvent(input: SaveEventInput) {
    const rows = (await this.getSql().query(
      `
      INSERT INTO events (
        user_id,
        title,
        description,
        event_date,
        event_time,
        estimated_duration_hours,
        location,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4::date, $5::time, $6, $7, $8, $8)
      RETURNING
        id,
        user_id,
        title,
        description,
        event_date,
        event_time,
        estimated_duration_hours,
        location,
        created_at,
        updated_at,
        deleted_at
      `,
      eventParams(input),
    )) as EventRow[];

    return mapEvent(rows[0]);
  }

  async updateEvent(input: SaveEventInput & { eventId: string }) {
    const rows = (await this.getSql().query(
      `
      UPDATE events
      SET title = $3,
          description = $4,
          event_date = $5::date,
          event_time = $6::time,
          estimated_duration_hours = $7,
          location = $8,
          updated_at = $9
      WHERE user_id = $1
        AND id = $2
        AND deleted_at IS NULL
      RETURNING
        id,
        user_id,
        title,
        description,
        event_date,
        event_time,
        estimated_duration_hours,
        location,
        created_at,
        updated_at,
        deleted_at
      `,
      [
        input.userId,
        input.eventId,
        input.title,
        input.description,
        input.eventDate,
        input.eventTime,
        input.estimatedDurationHours,
        input.location,
        input.occurredAt,
      ],
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
}
