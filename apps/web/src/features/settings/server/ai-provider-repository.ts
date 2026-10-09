import type { NeonQueryFunction } from "@neondatabase/serverless";
import { getSql } from "../../../server/database/neon.ts";
import { defaultAIModel } from "../ai-provider.ts";
import type { GeminiModel } from "../ai-provider.ts";

export type AICredential = { enabled: boolean; encrypted_api_key: string | null; model: GeminiModel };

export class AIProviderRepository {
  private readonly sql?: NeonQueryFunction<false, false>;
  constructor(sql?: NeonQueryFunction<false, false>) { this.sql = sql; }

  async find(userId: string): Promise<AICredential | null> {
    const rows = await (this.sql ?? getSql()).query(
      "SELECT enabled, encrypted_api_key, model FROM user_ai_settings WHERE user_id = $1", [userId],
    );
    return rows[0] as AICredential ?? null;
  }

  async save(userId: string, enabled: boolean, encryptedKey: string | null, removeKey: boolean, model?: GeminiModel) {
    // A blank replacement preserves the current key atomically, including concurrent saves.
    const rows = await (this.sql ?? getSql()).query(
      `INSERT INTO user_ai_settings (user_id, enabled, encrypted_api_key, model)
       VALUES ($1, $2, CASE WHEN $4 THEN NULL ELSE COALESCE($3,
         (SELECT encrypted_api_key FROM user_ai_settings WHERE user_id = $1)) END, COALESCE($5, $6))
       ON CONFLICT (user_id) DO UPDATE SET
         enabled = EXCLUDED.enabled,
         encrypted_api_key = CASE WHEN $4 THEN NULL
           ELSE COALESCE($3, user_ai_settings.encrypted_api_key) END,
         model = COALESCE($5, user_ai_settings.model),
         updated_at = now()
       RETURNING enabled, encrypted_api_key IS NOT NULL AS has_key, model`,
      [userId, enabled, encryptedKey, removeKey, model ?? null, defaultAIModel],
    );
    const row = rows[0];
    if (!row) throw new Error("AI settings write failed.");
    return { enabled: Boolean(row.enabled), provider: "google_gemini" as const, hasKey: Boolean(row.has_key), model: row.model as GeminiModel };
  }

  async claimTest(userId: string) {
    const rows = await (this.sql ?? getSql()).query(
      `INSERT INTO user_ai_settings (user_id, last_test_at) VALUES ($1, now())
       ON CONFLICT (user_id) DO UPDATE SET last_test_at = now()
       WHERE user_ai_settings.last_test_at IS NULL
          OR user_ai_settings.last_test_at <= now() - interval '30 seconds'
       RETURNING user_id`, [userId],
    );
    return rows.length === 1;
  }
}
