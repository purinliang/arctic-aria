import { getSql } from '../../../server/database/neon.ts';
import { parseAmount } from '../money.ts';
import type { Expense, ExpenseInput, MoneyCategory, MoneyData, MoneyPeriod, MoneySettings } from '../types.ts';
import type { NeonQueryFunction } from '@neondatabase/serverless';

export class MoneyRepository {
  private readonly client?: NeonQueryFunction<false, false>;
  constructor(client?: NeonQueryFunction<false, false>) { this.client = client; }
  private sql() { return this.client ?? getSql(); }
  async data(owner: string, period: MoneyPeriod): Promise<MoneyData> {
    const sql = this.sql();
    await sql.query('SELECT initialize_money($1::uuid)', [owner]);
    const categories = await sql.query(`SELECT id, name, seed_key AS "seedKey", archived_at IS NOT NULL AS archived FROM money_categories WHERE user_id = $1
      ORDER BY archived_at NULLS FIRST, seed_key IS NULL,
      array_position(ARRAY['food','transport','shopping','housing','bills','other','health'],seed_key) NULLS LAST,
      position, name, id`, [owner]) as MoneyCategory[];
    const settings = await sql.query('SELECT preferred_currencies AS "preferredCurrencies" FROM money_settings WHERE user_id = $1', [owner]);
    const quick = await sql.query('SELECT category_id AS id FROM money_quick_categories WHERE user_id = $1 ORDER BY position', [owner]);
    const expenses = await sql.query(`SELECT id, category_id AS "categoryId", amount_minor::text AS "amountMinor", currency,
      recorded_date::text AS date, note FROM money_expenses WHERE user_id = $1 AND deleted_at IS NULL
      AND recorded_date >= CASE WHEN $2 = 'month' THEN date_trunc('month', $3::date)::date ELSE $3::date END
      AND recorded_date < CASE WHEN $2 = 'month' THEN (date_trunc('month', $3::date) + interval '1 month')::date ELSE $3::date + 1 END
      ORDER BY recorded_date DESC, created_at DESC, id DESC`, [owner, period.mode, period.date]);
    return { categories, settings: { preferredCurrencies: settings[0].preferredCurrencies, quickCategoryIds: quick.map((row) => row.id) } as MoneySettings,
      expenses: expenses.map((row) => ({ ...row, amountMinor: Number(row.amountMinor) })) as Expense[] };
  }
  async save(owner: string, input: ExpenseInput) {
    const args = [owner, input.id, input.categoryId, parseAmount(input.amount, input.currency), input.currency, input.date, input.note.trim() || null];
    const rows = await this.sql().query(input.isNew
      ? `INSERT INTO money_expenses (user_id,id,category_id,amount_minor,currency,recorded_date,note)
          SELECT $1,$2,$3,$4,$5,$6,$7 FROM money_categories WHERE user_id = $1 AND id = $3 AND archived_at IS NULL
          ON CONFLICT (id) DO UPDATE SET id = EXCLUDED.id WHERE money_expenses.user_id = $1 AND money_expenses.deleted_at IS NULL RETURNING id`
      : `UPDATE money_expenses expense SET category_id = $3, amount_minor = $4, currency = $5, recorded_date = $6, note = $7, updated_at = now()
          WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL AND EXISTS (SELECT 1 FROM money_categories category
          WHERE category.user_id = $1 AND category.id = $3 AND (category.archived_at IS NULL OR category.id = expense.category_id)) RETURNING id`, args);
    return rows.length > 0;
  }
  async archive(owner: string, id: string) {
    return (await this.sql().query('UPDATE money_expenses SET deleted_at = now(), updated_at = now() WHERE user_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING id', [owner, id])).length > 0;
  }
  async settings(owner: string, settings: MoneySettings) {
    return (await this.sql().query('SELECT save_money_settings($1::uuid,$2::text[],$3::uuid[]) AS saved', [owner, settings.preferredCurrencies, settings.quickCategoryIds]))[0].saved === true;
  }
  async category(owner: string, id: string, name: string, isNew: boolean) {
    return (await this.sql().query('SELECT save_money_category($1::uuid,$2::uuid,$3,$4) AS saved',[owner,id,name.trim(),isNew]))[0].saved === true;
  }
  async reorderCategories(owner: string, ids: string[]) {
    return (await this.sql().query('SELECT reorder_money_categories($1::uuid,$2::uuid[]) AS saved',[owner,ids]))[0].saved === true;
  }
  async archiveCategory(owner: string, id: string) {
    return (await this.sql().query('SELECT archive_money_category($1::uuid,$2::uuid) AS saved', [owner, id]))[0].saved === true;
  }
}
