import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';
import { neon } from '@neondatabase/serverless';
import { createAuthSessionToken } from '../src/features/auth/server/session.ts';

if (!process.argv.includes('--confirm-development')) throw new Error('Requires --confirm-development; never run against production.');
const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
if (!['localhost','127.0.0.1'].includes(new URL(baseUrl).hostname)) throw new Error('Local server required.');
const sql = neon(process.env.NEON_POSTGRES_URL);
const id = randomUUID(), username = `test${randomUUID().replaceAll('-','').slice(0,12)}`;
const browser = await chromium.launch({ headless: true });
let created = false;
let page;
try {
  await sql.query('INSERT INTO users (id,username,password_hash,display_name) VALUES ($1,$2,$3,$4)',[id,username,'disabled-test-login','Test User']);
  created = true;
  const context = await browser.newContext({ viewport: { width: 1280,height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem('arctic-aria.language-preference','en');
    localStorage.setItem('arctic-aria.theme-preference','light');
  });
  await context.addCookies([{ name: 'arctic_aria_session',value: createAuthSessionToken({ id,username,displayName: 'Test User',isAdmin: false },process.env.AUTH_SESSION_SECRET),url: baseUrl,httpOnly: true,sameSite: 'Lax' }]);
  page = await context.newPage();
  page.setDefaultTimeout(60_000);
  const errors = [];
  page.on('pageerror',(error) => errors.push(error.name));
  // No route interception: every action uses the real local backend and selected database.
  await page.goto(`${baseUrl}/money`);
  await page.getByRole('button',{ name: 'Food',exact: true }).click();
  await page.getByLabel('Amount',{ exact: true }).fill('12.34');
  await page.getByRole('button',{ name: 'Save',exact: true }).click();
  await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
  const expenses = await sql.query('SELECT amount_minor::text,currency FROM money_expenses WHERE user_id = $1',[id]);
  assert.deepEqual(expenses,[{ amount_minor: '1234',currency: 'AUD' }]);
  await page.reload();
  await page.getByRole('button',{ name: 'Food',exact: true }).waitFor();
  await page.goto(`${baseUrl}/supplies`);
  await page.getByRole('button',{ name: 'New',exact: true }).click();
  await page.getByLabel('Title',{ exact: true }).fill('Live stock fixture');
  await page.getByLabel('Unopened spares',{ exact: true }).fill('1');
  await page.getByRole('button',{ name: 'Save',exact: true }).click();
  await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
  const level = page.getByRole('radio',{ name: 'Remaining: Live stock fixture: 2/5',exact: true });
  await level.click();
  await page.waitForFunction(() => {
    const button = document.querySelector('button[aria-label="Remaining: Live stock fixture: 2/5"]');
    return button?.getAttribute('aria-checked') === 'true' && !button.disabled;
  });
  await page.getByRole('button',{ name: 'Replace: Live stock fixture',exact: true }).click();
  await page.locator('.aa-dialog-overlay').getByRole('button',{ name: 'Replace',exact: true }).click();
  await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
  const stock = await sql.query('SELECT level,spares,version FROM supply_items WHERE user_id = $1',[id]);
  assert.deepEqual(stock,[{ level: 5,spares: 0,version: 3 }]);
  const history = await sql.query('SELECT count(*)::integer AS count FROM supply_observations WHERE user_id = $1',[id]);
  assert.equal(history[0].count,3);
  await page.reload();
  await page.getByRole('radio',{ name: 'Remaining: Live stock fixture: 5/5',exact: true }).waitFor();
  assert.deepEqual(errors,[]);
  console.log('Live backend checks passed: expense persistence, stock observation, replacement, history, and reload.');
} catch (error) {
  if (page) await page.screenshot({ path: '/tmp/arctic-aria-live-check-failure.png',fullPage: true });
  throw error;
} finally {
  await browser.close();
  if (created) {
    const tables = ['supply_commands','supply_observations','supply_wishlist','supply_items','money_expenses','money_quick_categories','money_settings','money_categories','users'];
    await sql.transaction(tables.map((table) => sql.query(`DELETE FROM ${table} WHERE ${table === 'users' ? 'id' : 'user_id'} = $1`,[id])));
    console.log('Removed isolated live-test account and its fixture records.');
  }
}
