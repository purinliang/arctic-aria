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
  await page.getByRole('button',{ name: 'New expense',exact: true }).click();
  await page.getByLabel('Amount',{ exact: true }).fill('12.34');
  await page.getByRole('button',{ name: 'Save',exact: true }).click();
  await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
  await page.getByText('AUD 12.34',{ exact: true }).first().waitFor();
  const expenses = await sql.query('SELECT amount_minor::text,currency FROM money_expenses WHERE user_id = $1',[id]);
  assert.deepEqual(expenses,[{ amount_minor: '1234',currency: 'AUD' }]);
  await page.reload();
  await page.getByRole('button',{ name: 'New expense',exact: true }).waitFor();
  await page.goto(`${baseUrl}/supplies`);
  await page.getByRole('button',{ name: 'New',exact: true }).click();
  await page.getByLabel('Title',{ exact: true }).fill('Live stock fixture');
  assert.equal(await page.getByRole('slider',{ name: 'Initial stock',exact: true }).inputValue(),'5');
  await page.getByRole('button',{ name: 'Create',exact: true }).click();
  await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
  const slider = page.getByRole('slider',{ name: 'Remaining: Live stock fixture',exact: true });
  await slider.focus(); await page.keyboard.press('Home');
  await page.waitForFunction(() => {
    const slider = document.querySelector('input[aria-label="Remaining: Live stock fixture"]');
    return slider && !slider.disabled && slider.value === '0';
  });
  let stock = await sql.query('SELECT quantity::text,increment::text,unit,version FROM supply_items WHERE user_id = $1',[id]);
  assert.deepEqual(stock,[{ quantity: '0.000',increment: '1.000',unit: 'unit',version: 2 }]);
  await slider.focus(); await page.keyboard.press('End');
  await page.waitForFunction(() => !document.querySelector('input[aria-label="Remaining: Live stock fixture"]').disabled);
  stock = await sql.query('SELECT quantity::text,target_quantity::text,version FROM supply_items WHERE user_id = $1',[id]);
  assert.deepEqual(stock,[{ quantity: '5.000',target_quantity: '5.000',version: 3 }]);
  await page.reload();
  await page.getByText('5/5',{ exact: true }).waitFor();
  const legacyId = randomUUID();
  await sql.query('SELECT save_supply_stock($1::uuid,$2::uuid,true,1,$3,$4,NULL,2.5,$5,0.5,2,1,2)',[id,legacyId,'food','Legacy stock fixture','kg']);
  await page.reload(); await page.getByText('2.5 kg',{ exact: true }).waitFor();
  assert.equal(await page.getByRole('slider',{ name: 'Remaining: Legacy stock fixture',exact: true }).count(),0);
  await page.getByRole('button',{ name: 'Edit: Legacy stock fixture',exact: true }).click();
  await page.getByLabel('Title',{ exact: true }).fill('Renamed legacy fixture');
  await page.getByRole('button',{ name: 'Save',exact: true }).click();
  await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
  const legacy = await sql.query('SELECT quantity::text,unit,increment::text,target_quantity::text,low_stock_threshold::text,spares,level FROM supply_items WHERE id = $1',[legacyId]);
  assert.deepEqual(legacy,[{ quantity: '2.500',unit: 'kg',increment: '0.500',target_quantity: '2.000',low_stock_threshold: '1.000',spares: 2,level: 5 }]);
  assert.deepEqual(errors,[]);
  console.log('Live backend checks passed: expenses, default level 5, zero/refill slider saves, reload and legacy quantity preservation.');
} catch (error) {
  if (page) await page.screenshot({ path: '/tmp/arctic-aria-live-check-failure.png',fullPage: true });
  throw error;
} finally {
  await browser.close();
  if (created) {
    const tables = ['supply_commands','supply_observations','supply_wishlist','supply_items','money_expenses','money_quick_categories','money_settings','users'];
    await sql.transaction(tables.map((table) => sql.query(`DELETE FROM ${table} WHERE ${table === 'users' ? 'id' : 'user_id'} = $1`,[id])));
    console.log('Removed isolated live-test account and its fixture records.');
  }
}
