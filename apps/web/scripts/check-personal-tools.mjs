import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:3001';
const output = process.env.SCREENSHOT_DIR ?? '/tmp/arctic-aria-personal-tools';
const manifest = JSON.parse(await readFile(new URL('../.next/server/server-reference-manifest.json', import.meta.url), 'utf8'));
const names = new Map(Object.entries(manifest.node).map(([id, value]) => [id, value.exportedName]));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1280, 390]) for (const language of ['en', 'zh-CN']) for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, timezoneId: 'Australia/Sydney' });
    const preferences = { languagePreference: language, themePreference: theme, timeZonePreference: 'Australia/Sydney', resolvedTimeZone: 'Australia/Sydney', timeFormatPreference: '24h', multipleTimezonesEnabled: false };
    await context.addInitScript(({ language, theme }) => {
      localStorage.setItem('arctic-aria.language-preference', language);
      localStorage.setItem('arctic-aria.theme-preference', theme);
    }, { language, theme });
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    const categories = ['food','transport','housing','bills','shopping','health','other'].map((seedKey) => ({ id: randomUUID(), seedKey, name: null, archived: false }));
    let settings = { preferredCurrencies: ['AUD','CNY'], quickCategoryIds: categories.slice(0,5).map((category) => category.id) };
    const expenses = Array.from({ length: 8 }, (_, index) => ({ id: randomUUID(), categoryId: categories[0].id, amountMinor: 1230, currency: index === 7 ? 'CNY' : 'AUD', date: today, note: null }));
    const failures = []; let failExpense = false; let monthlyRequested = false;
    await context.route('**/*', async (route) => {
      const request = route.request(), id = request.headers()['next-action'];
      if (!id) return new URL(request.url()).origin === new URL(baseUrl).origin ? route.continue() : route.abort();
      const name = names.get(id), args = JSON.parse(request.postData() ?? '[]', (_key, value) => value === '$undefined' ? undefined : value);
      let result;
      if (name === 'getCurrentUser') result = { id: '11111111-1111-4111-8111-111111111111', username: 'testusername', displayName: 'Test User', isAdmin: false, expiresAt: Date.now() + 3600_000 };
      else if (name === 'getPublicVersionStatus') result = { appVersionText: 'test', actualDatabaseVersionText: 'test', expectedDatabaseVersionText: 'test', aligned: true, message: '' };
      else if (['getUserPreferences','saveResolvedTimeZone'].includes(name)) result = { ok: true, preferences };
      else if (name === 'getMoneyData') { monthlyRequested ||= args[0].mode === 'month'; result = { ok: true, data: { categories, settings, expenses } }; }
      else if (name === 'saveMoneySettings') { settings = args[0]; result = { ok: true, data: true }; }
      else if (name === 'saveExpense') {
        if (failExpense) { failExpense = false; result = { ok: false, code: 'unavailable', category: 'database_update', message: 'Unavailable' }; }
        else {
          const input = args[0]; const entry = input.isNew ? { id: input.id } : expenses.find((entry) => entry.id === input.id);
          assert.ok(entry); Object.assign(entry, { categoryId: input.categoryId, amountMinor: Math.round(Number(input.amount) * (input.currency === 'JPY' ? 1 : 100)), currency: input.currency, date: input.date, note: input.note || null });
          if (input.isNew && !expenses.some((item) => item.id === entry.id)) expenses.unshift(entry);
          result = { ok: true, data: true };
        }
      } else if (name === 'archiveExpense') { expenses.splice(expenses.findIndex((entry) => entry.id === args[0]), 1); result = { ok: true, data: true }; }
      else if (name === 'saveMoneyCategory') { const input = args[0]; const category = input.isNew ? { id: input.id, seedKey: null, archived: false } : categories.find((category) => category.id === input.id); Object.assign(category, { name: input.name }); if (input.isNew) categories.push(category); result = { ok: true, data: true }; }
      else if (name === 'archiveMoneyCategory') { categories.find((category) => category.id === args[0]).archived = true; settings.quickCategoryIds = settings.quickCategoryIds.filter((id) => id !== args[0]); result = { ok: true, data: true }; }
      else if (name === 'getIdeaPageData') result = { ok: true, data: [] };
      else if (name?.startsWith('get') && name.endsWith('DashboardData')) result = { ok: true, data: { projects: [], tasks: [], events: [], eventInstances: [], todayEvents: [], eventGroups: [], routines: [], routineInstances: [], routineDefinitions: [], routineGroups: [], categories: [], pinnedMemories: [], memoryRecords: [] } };
      else { failures.push(`Unexpected action ${name}`); result = { ok: false, code: 'unavailable', category: 'server', message: 'Unsupported fixture action' }; }
      await route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":[],"b":"fixture"}\n1:${JSON.stringify(result)}\n` });
    });
    const page = await context.newPage(); page.on('pageerror', (error) => failures.push(error.message));
    const en = language === 'en', save = en ? 'Save' : '保存', food = en ? 'Food' : '饮食';
    await page.goto(`${baseUrl}/money`);
    await page.getByRole('button', { name: food, exact: true }).waitFor();
    await page.getByRole('button', { name: en ? 'Currencies' : '货币', exact: true }).click();
    await page.getByRole('button', { name: `${en ? 'Move up' : '上移'}: CNY`, exact: true }).click();
    await page.getByRole('button', { name: save, exact: true }).click();
    await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
    assert.equal(settings.preferredCurrencies[0], 'CNY');
    await page.getByRole('button', { name: food, exact: true }).click();
    assert.equal(await page.getByRole('radio', { name: 'CNY', exact: true }).getAttribute('aria-checked'), 'true');
    await page.getByLabel(en ? 'Amount' : '金额', { exact: true }).fill('45.67');
    failExpense = true;
    await page.getByRole('button', { name: save, exact: true }).click();
    await page.waitForFunction((text) => [...document.querySelectorAll('button')].some((button) => button.textContent.trim() === text && !button.disabled), save);
    assert.equal(expenses.length, 8); assert.equal(await page.getByLabel(en ? 'Amount' : '金额', { exact: true }).inputValue(), '45.67');
    await page.getByRole('button', { name: save, exact: true }).click();
    await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' }); assert.equal(expenses.length, 9);
    await page.getByRole('tab', { name: en ? 'Month' : '月', exact: true }).click();
    await page.waitForFunction((text) => !document.body.textContent.includes(text), en ? 'Loading expenses' : '正在加载支出');
    assert.ok(monthlyRequested);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Money must fit viewport');
    await page.screenshot({ path: `${output}/money-${width}-${language}-${theme}.png`, fullPage: true });
    await page.reload(); await page.getByRole('button', { name: food, exact: true }).waitFor();
    assert.deepEqual(failures, []);
    await context.close();
  }
  console.log('Money browser matrix passed: capture, currency ordering/default, failure retry, month selection, reload, and responsive layouts.');
} finally { await browser.close(); }
