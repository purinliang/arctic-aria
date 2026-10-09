import { neon } from '@neondatabase/serverless';

if (!process.argv.includes('--confirm-recovery')) {
  throw new Error('Requires --confirm-recovery and an explicitly selected development database.');
}
const sql = neon(process.env.NEON_POSTGRES_URL);
// Only recover the known pre-function failure; refuse applied migrations or any data.
await sql.transaction([
  sql.query('LOCK TABLE money_expenses,money_quick_categories,money_settings,money_categories IN ACCESS EXCLUSIVE MODE'),
  sql.query(`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM schema_migrations WHERE name = '0037_create_money.sql')
      OR EXISTS (SELECT 1 FROM money_expenses) OR EXISTS (SELECT 1 FROM money_quick_categories)
      OR EXISTS (SELECT 1 FROM money_settings) OR EXISTS (SELECT 1 FROM money_categories)
      OR to_regprocedure('save_money_settings(uuid,text[],uuid[])') IS NOT NULL
      OR to_regprocedure('initialize_money(uuid)') IS NOT NULL
      OR to_regprocedure('archive_money_category(uuid,uuid)') IS NOT NULL
    THEN RAISE EXCEPTION 'Recovery refused: schema contains data or does not match the incomplete migration'; END IF;
  END $$`),
  sql.query('DROP TABLE money_expenses,money_quick_categories,money_settings,money_categories'),
]);
console.log('Recovered empty incomplete Money tables; rerun database:migrate.');
