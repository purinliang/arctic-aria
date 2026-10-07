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
    const entries = Array.from({ length: 8 }, (_, index) => ({ id: randomUUID(), activity: 'work', durationMinutes: 30, note: index === 0 ? 'Progress fixture '.repeat(25) : null, occurredAt: new Date(Date.now() - index * 60_000).toISOString() }));
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
      const args = JSON.parse(request.postData() ?? '[]', (_key, value) => value === '$undefined' ? undefined : value);
      let result;
      if (name === 'getCurrentUser') result = { id: '11111111-1111-4111-8111-111111111111', username: 'testusername', displayName: 'Test User', isAdmin: false, expiresAt: Date.now() + 3600_000 };
      else if (name === 'getPublicVersionStatus') result = { appVersionText: 'test', actualDatabaseVersionText: 'test', expectedDatabaseVersionText: 'test', aligned: true, message: '' };
      else if (['getUserPreferences', 'saveResolvedTimeZone'].includes(name)) result = { ok: true, preferences };
      else if (name === 'getLifeEntries') result = { ok: true, data: entries };
      else if (['getLifeChatHistory', 'sendLifeChatMessage'].includes(name)) {
        failures.push('Hidden chat must not request history or send messages');
        result = { ok: false, category: 'server', message: 'Chat is hidden' };
      }
      else if (name === 'saveLifeEntry') {
        await new Promise((resolve) => setTimeout(resolve, 180));
        if (failNextCapture) {
          failNextCapture = false;
          result = { ok: false, category: 'database_update', code: 'life_unavailable', message: 'Unavailable' };
        } else {
          const input = args[0];
          const entry = input.id ? entries.find((entry) => entry.id === input.id) : { id: randomUUID() };
          assert.ok(entry);
          Object.assign(entry, { activity: input.activity, durationMinutes: input.durationMinutes, note: input.note ?? null, occurredAt: input.occurredAt ?? new Date().toISOString() });
          if (!input.id) entries.unshift(entry);
          result = { ok: true, data: entry };
        }
      } else if (name === 'archiveLifeEntry') {
        entries.splice(entries.findIndex((entry) => entry.id === args[0]), 1);
        result = { ok: true, data: args[0] };
      } else if (name === 'getIdeaPageData') result = { ok: true, data: [] };
      else if (name?.startsWith('get') && name.endsWith('DashboardData')) result = { ok: true, data: { projects: [], tasks: [], events: [], eventInstances: [], todayEvents: [], eventGroups: [], routines: [], routineInstances: [], routineDefinitions: [], routineGroups: [], categories: [], pinnedMemories: [], memoryRecords: [] } };
      else { failures.push(`Unexpected action ${name}`); result = { ok: false, category: 'server', message: 'Unsupported fixture action' }; }
      await route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":[],"b":"fixture"}\n1:${JSON.stringify(result)}\n` });
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => failures.push(error.message));
    await page.goto(`${baseUrl}/daily`);
    await page.waitForURL(`${baseUrl}/progress`);
    const labels = language === 'en' ? ['Work', 'Study', 'Exercise'] : ['工作', '学习', '运动'];
    const durationLabel = language === 'en' ? 'Duration (minutes)' : '时长（分钟）';
    const saveLabel = language === 'en' ? 'Save' : '保存';
    for (const label of labels) {
      const card = page.getByRole('button', { name: label, exact: true });
      await card.waitFor();
      await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((button) => button.getAttribute('aria-label') === label && !button.disabled), label);
      await card.click();
      await page.getByLabel(durationLabel, { exact: true }).fill('45');
      await page.getByRole('button', { name: saveLabel, exact: true }).click();
      await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
      assert.equal((await card.innerText()).trim(), label, 'idle capture cards must show only the activity name');
      assert.ok(await card.evaluate((button) => button.scrollWidth <= button.clientWidth), 'capture label must fit its card');
    }
    assert.equal(entries.length, 11);
    assert.equal(await page.getByRole('textbox').count(), 0, 'chat composer must be absent');
    assert.equal(await page.getByRole('heading', { name: language === 'en' ? 'Chat' : '聊天', exact: true }).count(), 0, 'chat panel must be absent');
    const week = page.getByRole('group', { name: language === 'en' ? 'Last seven days' : '最近七天', exact: true });
    await week.waitFor();
    const columns = await week.locator('button').evaluateAll((buttons) => buttons.map((button) => ({
      title: button.getAttribute('aria-label'), x: button.getBoundingClientRect().x, y: button.getBoundingClientRect().y,
    })));
    assert.equal(columns.length, 7, 'week must show seven day columns');
    assert.ok(columns.at(-1).title.startsWith(language === 'en' ? 'Today:' : '今天:'), 'Today must be the rightmost day');
    assert.ok(columns.at(-1).title.includes(language === 'en' ? 'Work: 285 min' : '工作: 285 分钟'), 'chart must sum work durations');
    assert.ok(columns.every((column, index) => column.y === columns[0].y && (index === 0 || column.x > columns[index - 1].x)), 'days must run left to right in one row');
    assert.equal(await page.getByRole('button', { name: /Refresh|刷新/, exact: true }).count(), 0, 'Daily must not have a refresh button');
    const todayBounds = await week.locator('button').last().boundingBox();
    assert.ok(todayBounds && todayBounds.x >= 0 && todayBounds.x + todayBounds.width <= width, 'Today must be reachable within the card viewport');
    const paginationFits = await page.locator('nav[aria-label]').evaluateAll((navs) => navs.every((nav) => {
      const bounds = nav.getBoundingClientRect();
      return [...nav.children].every((child) => {
        const item = child.getBoundingClientRect();
        return item.left >= bounds.left && item.right <= bounds.right;
      });
    }));
    assert.ok(paginationFits, 'pagination controls must fit inside their day column');
    await week.locator('button').first().click();
    assert.equal(await page.getByRole('button', { name: language === 'en' ? 'Edit entry: Exercise' : '编辑记录: 运动', exact: true }).count(), 0);
    await week.locator('button').last().click();
    await page.screenshot({ path: `${output}/${width}-${language}-${theme}.png`, fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'page must not overflow horizontally');
    await page.reload();
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
    await page.getByLabel(durationLabel, { exact: true }).fill('20');
    await page.getByRole('button', { name: saveLabel, exact: true }).click();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((button) => button.textContent.trim() === label && !button.disabled), saveLabel);
    assert.equal(entries.length, count, 'failed capture must roll back');
    assert.equal(await page.getByLabel(durationLabel, { exact: true }).inputValue(), '20', 'failed save must retain duration');
    await page.getByRole('button', { name: saveLabel, exact: true }).click();
    await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
    assert.equal(entries.length, count + 1, 'retry must save the retained draft');
    assert.deepEqual(failures, []);
    await context.close();
  }
  console.log('Progress browser checks passed at desktop/mobile widths in both languages and themes: duration recording, chart totals and day selection, hidden chat, edit, reload, failed-save retry, and no horizontal overflow.');
} finally { await browser.close(); }
