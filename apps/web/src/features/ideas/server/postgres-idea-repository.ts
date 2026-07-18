import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import type {
  ArchiveIdeaInput,
  CaptureIdeaInput,
  IdeaRecord,
  IdeaRepository,
  IdeaSource,
  IdeaTriageStatus,
  UpdateIdeaInput,
} from "./idea-repository.ts";

type Sql = NeonQueryFunction<false, false>;

type IdeaRow = {
  id: string;
  user_id: string;
  raw_text: string;
  source: string;
  triage_status: string;
  source_metadata: Record<string, unknown> | null;
  created_at: Date | string;
  updated_at: Date | string;
  archived_at: Date | string | null;
};

function mapIdea(row: IdeaRow): IdeaRecord {
  return {
    id: row.id,
    userId: row.user_id,
    rawText: row.raw_text,
    source: row.source as IdeaSource,
    triageStatus: row.triage_status as IdeaTriageStatus,
    sourceMetadata: row.source_metadata ?? {},
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    archivedAt: row.archived_at ? new Date(row.archived_at) : null,
  };
}

export class PostgresIdeaRepository implements IdeaRepository {
  private readonly sql?: Sql;

  constructor(sql?: Sql) {
    this.sql = sql;
  }

  async capture(input: CaptureIdeaInput) {
    const rows = (await this.getSql().query(
      `INSERT INTO ideas (
         user_id,
         raw_text,
         source,
         triage_status,
         source_metadata,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3, 'untriaged', $4::jsonb, $5, $5)
       RETURNING
         id,
         user_id,
         raw_text,
         source,
         triage_status,
         source_metadata,
         created_at,
         updated_at,
         archived_at`,
      [
        input.userId,
        input.rawText,
        input.source,
        JSON.stringify(input.sourceMetadata ?? {}),
        input.occurredAt,
      ],
    )) as IdeaRow[];

    return mapIdea(rows[0]);
  }

  async listUnarchived(userId: string) {
    const rows = (await this.getSql().query(
      `SELECT
         id,
         user_id,
         raw_text,
         source,
         triage_status,
         source_metadata,
         created_at,
         updated_at,
         archived_at
       FROM ideas
       WHERE user_id = $1
         AND archived_at IS NULL
       ORDER BY created_at DESC`,
      [userId],
    )) as IdeaRow[];

    return rows.map(mapIdea);
  }

  async update(input: UpdateIdeaInput) {
    const rows = (await this.getSql().query(
      `UPDATE ideas
       SET raw_text = $3,
           updated_at = $4
       WHERE user_id = $1
         AND id = $2
         AND archived_at IS NULL
       RETURNING
         id,
         user_id,
         raw_text,
         source,
         triage_status,
         source_metadata,
         created_at,
         updated_at,
         archived_at`,
      [input.userId, input.ideaId, input.rawText, input.occurredAt],
    )) as IdeaRow[];

    return rows[0] ? mapIdea(rows[0]) : null;
  }

  async archive(input: ArchiveIdeaInput) {
    const rows = (await this.getSql().query(
      `UPDATE ideas
       SET triage_status = 'archived',
           archived_at = $3,
           updated_at = $3
       WHERE user_id = $1
         AND id = $2
         AND archived_at IS NULL
       RETURNING id`,
      [input.userId, input.ideaId, input.occurredAt],
    )) as Array<{ id: string }>;

    return rows.length > 0;
  }

  private getSql() {
    return this.sql ?? getSql();
  }
}
