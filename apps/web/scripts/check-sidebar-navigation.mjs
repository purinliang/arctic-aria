import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';

// Mock account and feature reads; no credentials or database writes are used.
const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:3001';
const manifest = JSON.parse(await readFile(new URL('../.next/server/server-reference-manifest.json', import.meta.url), 'utf8'));
const names = new Map(Object.entries(manifest.node).map(([id, action]) => [id, action.exportedName]));
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1280, 390]) for (const language of ['en', 'zh-CN']) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const errors = [];
    const preferences = { languagePreference: language, themePreference: 'dark', timeZonePreference: 'system', resolvedTimeZone: null, timeFormatPreference: '24h', multipleTimezonesEnabled: false };
    await context.route('**/*', async route => {
      const request = route.request(), action = request.headers()['next-action'];
      if (!action) return new URL(request.url()).origin === new URL(baseUrl).origin ? route.continue() : route.abort();
      const name = names.get(action);
      let result;
      if (name === 'getCurrentUser') result = { id: '11111111-1111-4111-8111-111111111111', username: 'testusername', displayName: 'Test User', isAdmin: false, expiresAt: Date.now() + 3600000 };
      else if (name === 'getPublicVersionStatus') result = { appVersionText: 'test', actualDatabaseVersionText: 'test', expectedDatabaseVersionText: 'test', aligned: true, message: '' };
      else if (['getUserPreferences', 'saveResolvedTimeZone'].includes(name)) result = { ok: true, preferences };
      else if (name === 'getDiscordBinding') result = { ok: true, binding: null };
      else if (name === 'getAIProviderSettings') result = { ok: true, data: { enabled: false, provider: 'google_gemini', hasKey: false, model: 'gemini-3.5-flash-lite' } };
      else if (name === 'getIdeaPageData') result = { ok: true, data: [] };
      else if (name?.startsWith('get') && name.endsWith('DashboardData')) result = { ok: true, data: { projects: [], tasks: [], events: [], eventInstances: [], todayEvents: [], eventGroups: [], routines: [], routineInstances: [], routineDefinitions: [], routineGroups: [], categories: [], pinnedMemories: [], memoryRecords: [] } };
      else { errors.push(`Unexpected action: ${name}`); result = { ok: false, code: 'unavailable', message: 'Unavailable' }; }
      await route.fulfill({ contentType: 'text/x-component', body: `0:{"a":"$@1","f":[],"b":"fixture"}\n1:${JSON.stringify(result)}\n` });
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.name));
    await page.goto(`${baseUrl}/settings`);
    const en = language === 'en';
    await page.getByRole('heading', { name: en ? 'Settings' : '设置', exact: true }).waitFor();
    if (width < 600) await page.getByRole('button', { name: en ? 'Open navigation' : '打开导航', exact: true }).click();
    const nav = page.locator('nav:visible');
    await nav.waitFor();
    const labels = await nav.locator('button').allTextContents();
    const expected = en ? ['Today', 'Projects', 'Routines', 'Money', 'Supplies', 'Events', 'Memories', 'Ideas', 'Settings']
      : ['今日', '项目', '日常', '财务', '物资', '事件', '回忆', '想法', '设置'];
    assert.deepEqual(labels.slice(0, expected.length).map(value => value.trim()), expected);
    assert.ok(!labels.some(value => /Progress|进步/.test(value)));
    for (const path of ['/progress', '/daily']) {
      await page.goto(`${baseUrl}${path}`);
      await page.waitForURL('**/today');
      await page.getByRole('heading', { level: 1, name: en ? 'Today' : '今日', exact: true }).waitFor();
      assert.equal(await page.getByRole('heading', { level: 1, name: en ? 'Progress' : '进步', exact: true }).count(), 0);
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`Sidebar order and hidden Progress routes passed: ${width}, ${language}`);
  }
} finally {
  await browser.close();
}
