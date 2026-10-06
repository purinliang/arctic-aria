import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

// Run against a production preview of this build. All server actions are mocked.
const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:3001';
const output = process.env.SCREENSHOT_DIR ?? '/tmp/arctic-aria-daily';
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
    const entries = Array.from({ length: 8 }, (_, index) => ({ id: randomUUID(), activity: 'meal', note: index === 0 ? 'Daily fixture '.repeat(25) : null, occurredAt: new Date(Date.now() - index * 60_000).toISOString() }));
    const turns = Array.from({ length: 8 }, (_, index) => ({ id: randomUUID(), message: `Earlier message ${index}`, responseCode: 'chat_not_available', createdAt: new Date(Date.now() - index * 60_000).toISOString() }));
    const failures = [];
    let failNextCapture = false;
    await context.route('**/*', async (route) => {
      const request = route.request();
      const id = request.headers()['next-action'];
      if (!id) {
        if (new URL(request.url()).origin !== new URL(baseUrl).origin) return route.abort();
        return route.continue();
      }
      const name = names.get(id);
      const args = JSON.parse(request.postData() ?? '[]');
      let result;
      if (name === 'getCurrentUser') result = { id: '11111111-1111-4111-8111-111111111111', username: 'testusername', displayName: 'Test User', isAdmin: false, expiresAt: Date.now() + 3600_000 };
      else if (name === 'getPublicVersionStatus') result = { appVersionText: 'test', actualDatabaseVersionText: 'test', expectedDatabaseVersionText: 'test', aligned: true, message: '' };
      else if (['getUserPreferences', 'saveResolvedTimeZone'].includes(name)) result = { ok: true, preferences };
      else if (name === 'getLifeEntries') result = { ok: true, data: entries };
      else if (name === 'getLifeChatHistory') result = { ok: true, data: turns };
      else if (name === 'saveLifeEntry') {
        await new Promise((resolve) => setTimeout(resolve, 180));
        if (failNextCapture) {
          failNextCapture = false;
          result = { ok: false, category: 'database_update', code: 'life_unavailable', message: 'Unavailable' };
        } else {
          const input = args[0];
          const entry = input.id ? entries.find((entry) => entry.id === input.id) : { id: randomUUID() };
          assert.ok(entry);
          Object.assign(entry, { activity: input.activity, note: input.note ?? null, occurredAt: input.occurredAt ?? new Date().toISOString() });
          if (!input.id) entries.unshift(entry);
          result = { ok: true, data: entry };
        }
      } else if (name === 'archiveLifeEntry') {
        entries.splice(entries.findIndex((entry) => entry.id === args[0]), 1);
        result = { ok: true, data: args[0] };
      } else if (name === 'sendLifeChatMessage') {
        const turn = { id: randomUUID(), message: args[0].message, responseCode: 'chat_not_available', createdAt: new Date().toISOString() };
        turns.unshift(turn); result = { ok: true, data: turn };
      } else if (name === 'getIdeaPageData') result = { ok: true, data: [] };
      else if (name?.startsWith('get') && name.endsWith('DashboardData')) result = { ok: true, data: { projects: [], tasks: [], events: [], eventInstances: [], todayEvents: [], eventGroups: [], routines: [], routineInstances: [], routineDefinitions: [], routineGroups: [], categories: [], pinnedMemories: [], memoryRecords: [] } };
      else { failures.push(`Unexpected action ${name}`); result = { ok: false, category: 'server', message: 'Unsupported fixture action' }; }
      await route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":[],"b":"fixture"}\n1:${JSON.stringify(result)}\n` });
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => failures.push(error.message));
    await page.goto(`${baseUrl}/daily`);
    const labels = language === 'en' ? ['Meal', 'Shower', 'Sleep', 'Exercise'] : ['用餐', '洗澡', '睡眠', '运动'];
    for (const label of labels) {
      const card = page.getByRole('button', { name: label, exact: true });
      await card.waitFor();
      await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((button) => button.getAttribute('aria-label') === label && !button.disabled), label);
      await card.click();
      await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((button) => button.getAttribute('aria-label') === label && !button.disabled), label);
    }
    assert.equal(entries.length, 12);
    const message = page.getByRole('textbox', { name: language === 'en' ? 'Chat message' : '聊天消息' });
    await message.fill('Please move all my projects to tomorrow.');
    await page.getByRole('button', { name: language === 'en' ? 'Send' : '发送', exact: true }).click();
    await page.getByText('Please move all my projects to tomorrow.', { exact: true }).waitFor();
    assert.equal(turns.length, 9);
    assert.equal(entries.length, 12, 'chat must not modify activities');
    assert.match(await page.locator('body').innerText(), language === 'en' ? /No actions were taken/ : /未执行任何操作/);
    await page.screenshot({ path: `${output}/${width}-${language}-${theme}.png`, fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'page must not overflow horizontally');
    await page.reload();
    await page.getByText('Please move all my projects to tomorrow.', { exact: true }).waitFor();
    const editName = language === 'en' ? 'Edit entry: Exercise' : '编辑记录: 运动';
    await page.getByRole('button', { name: editName, exact: true }).click();
    const note = page.getByLabel(language === 'en' ? 'Note' : '备注', { exact: true });
    await note.fill('A short walk.');
    await page.getByRole('button', { name: language === 'en' ? 'Save' : '保存', exact: true }).click();
    try {
      await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached', timeout: 5000 });
    } catch {
      await page.screenshot({ path: `${output}/editor-failure.png`, fullPage: true });
      throw new Error(`Editor did not close after save: ${await page.locator('body').innerText()}`);
    }
    await page.getByText('A short walk.', { exact: true }).waitFor();
    const count = entries.length;
    failNextCapture = true;
    await page.getByRole('button', { name: labels[1], exact: true }).click();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((button) => button.getAttribute('aria-label') === label && !button.disabled), labels[1]);
    assert.equal(entries.length, count, 'failed capture must roll back');
    assert.deepEqual(failures, []);
    await context.close();
  }
  console.log('Daily browser checks passed at desktop/mobile widths in both languages and themes: capture, chat placeholder, edit, reload, rollback, and no horizontal overflow.');
} finally { await browser.close(); }
