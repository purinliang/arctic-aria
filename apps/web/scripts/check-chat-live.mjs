import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, mkdir } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { chromium } from 'playwright';
import { ChatRepository } from '../src/features/chat/server/chat-repository.ts';
import { createChatService } from '../src/features/chat/server/chat-service.ts';
import { AIProviderRepository } from '../src/features/settings/server/ai-provider-repository.ts';
import { createCredentialEncryption } from '../src/server/ai/credential-encryption.ts';
import { GeminiError } from '../src/server/ai/gemini-client.ts';

// Disposable development records, fake provider; no billable Google requests.
if (!process.argv.includes('--confirm-development')) throw new Error('Development database confirmation required.');
const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:3001';
if (!['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname)) throw new Error('Localhost required.');
const sql = neon(process.env.NEON_POSTGRES_URL);
const repository = new ChatRepository(sql), settings = new AIProviderRepository(sql), encryption = createCredentialEncryption();
const manifest = JSON.parse(await readFile(new URL('../.next/server/server-reference-manifest.json', import.meta.url), 'utf8'));
const names = new Map(Object.entries(manifest.node).map(([id, value]) => [id, value.exportedName]));
const output = '/tmp/arctic-aria-chat'; await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const owners = [];
try {
  const publicContext = await browser.newContext();
  for (const action of ['getChatHistory', 'sendChatMessage']) {
    const [id] = [...names].find(([, name]) => name === action);
    const response = await publicContext.request.post(`${baseUrl}/settings`, {
      headers: { 'Next-Action': id, 'Content-Type': 'text/plain;charset=UTF-8', Origin: baseUrl },
      data: JSON.stringify(action === 'getChatHistory' ? [] : [randomUUID(), 'Test message']),
    });
    assert.ok((await response.text()).includes('chat_unauthorized'));
  }
  await publicContext.close();
  const cases = [
    { width: 1280, language: 'en', theme: 'dark' }, { width: 390, language: 'en', theme: 'light' },
    { width: 320, language: 'zh-CN', theme: 'dark' },
  ];
  for (const { width, language, theme } of cases.filter(item => !process.argv.includes('--desktop-only') || item.width === 1280)) {
    const userId = randomUUID(); owners.push(userId);
    await sql.query('INSERT INTO users (id, username, password_hash, display_name) VALUES ($1,$2,$3,$4)',
      [userId, `test${randomUUID().replaceAll('-', '').slice(0, 12)}`, 'disabled-test-login', 'Test User']);
    await settings.save(userId, true, encryption.encrypt(userId, 'test-owned-chat-key'), false);
    let calls = 0, reject = false, networkFailure = false;
    let providerError = null;
    const service = createChatService({ repository, settings, encryption, client: () => ({ async generateConversation(turns) {
      calls++; await new Promise(resolve => setTimeout(resolve, 300));
      if (reject) { reject = false; throw new GeminiError('request_failed', 429); }
      if (providerError) { const error = providerError; providerError = null; throw error; }
      return { text: `Reply to ${turns.at(-1).text}`, model: 'gemini-3.5-flash-lite' };
    } }) });
    const fixtureId = randomUUID(), lease = await repository.claim(userId, fixtureId, 'Fixture', 'test');
    assert.equal(await repository.find(randomUUID(), fixtureId), null);
    await assert.rejects(repository.claim(userId, randomUUID(), 'Concurrent', 'test'), error => error.code === '23505');
    assert.equal(await repository.finish(userId, fixtureId, randomUUID(), 'Stale reply'), null);
    await repository.finish(userId, fixtureId, lease, 'Fixture answer');
    await sql.query(`UPDATE ai_chat_exchanges SET created_at = now() - interval '8 days' WHERE id = $1`, [fixtureId]);
    assert.equal((await repository.list(userId)).entries.length, 0);
    await repository.expire(userId); assert.equal(await repository.find(userId, fixtureId), null);
    const staleId = randomUUID(), staleLease = await repository.claim(userId, staleId, 'Abandoned', 'test');
    await sql.query(`UPDATE ai_chat_exchanges SET updated_at = now() - interval '2 minutes' WHERE id = $1`, [staleId]);
    await repository.expire(userId);
    const newLease = await repository.claim(userId, staleId, 'Abandoned', 'test');
    assert.equal(await repository.finish(userId, staleId, staleLease, 'Old reply'), null);
    await repository.finish(userId, staleId, newLease, 'Recovered');
    await sql.query('DELETE FROM ai_chat_exchanges WHERE id = $1 AND user_id = $2', [staleId, userId]);
    await sql.query(`INSERT INTO ai_chat_exchanges (id, user_id, user_text, assistant_text, model, status, lease_id, created_at)
      SELECT gen_random_uuid(), $1, 'Page fixture', 'Fixture answer', 'test', 'complete', gen_random_uuid(),
      now() - interval '1 hour' + n * interval '1 second' FROM generate_series(1, 55) n`, [userId]);
    const first = await repository.list(userId);
    assert.equal(first.entries.length, 50); assert.equal(first.hasMore, true);
    const older = await repository.list(userId, { before: first.entries[0].id });
    assert.equal(older.entries.length, 5); assert.equal(older.hasMore, false);
    assert.equal((await repository.list(userId, { query: '%' })).entries.length, 0, 'Search is literal, not a SQL wildcard');
    await sql.query('DELETE FROM ai_chat_exchanges WHERE user_id = $1', [userId]);
    const context = await browser.newContext({ viewport: { width, height: 850 }, reducedMotion: 'reduce', hasTouch: width < 600, isMobile: width < 600 });
    const preferences = { languagePreference: language, themePreference: theme, timeZonePreference: 'system', resolvedTimeZone: null, timeFormatPreference: '24h', multipleTimezonesEnabled: false };
    const errors = [];
    await context.route('**/*', async route => {
      const request = route.request(), action = request.headers()['next-action'];
      if (!action) return new URL(request.url()).origin === new URL(baseUrl).origin ? route.continue() : route.abort();
      const name = names.get(action), args = JSON.parse(request.postData() ?? '[]', (_key, value) => value === '$undefined' ? undefined : value);
      let result;
      if (name === 'getCurrentUser') result = { id: userId, username: 'testusername', displayName: 'Test User', isAdmin: false, expiresAt: Date.now() + 3600000 };
      else if (name === 'getPublicVersionStatus') result = { appVersionText: 'test', actualDatabaseVersionText: 'test', expectedDatabaseVersionText: 'test', aligned: true, message: '' };
      else if (['getUserPreferences', 'saveResolvedTimeZone'].includes(name)) result = { ok: true, preferences };
      else if (name === 'getChatHistory') result = await service.history(userId, args[0]);
      else if (name === 'sendChatMessage') {
        if (networkFailure) { networkFailure = false; return route.abort('failed'); }
        result = await service.send(userId, ...args);
      }
      else if (name === 'getAIProviderSettings') result = { ok: true, data: { enabled: true, provider: 'google_gemini', hasKey: true, model: 'gemini-3.5-flash-lite' } };
      else if (name === 'getDiscordBinding') result = { ok: true, binding: null };
      else if (name === 'getIdeaPageData') result = { ok: true, data: [] };
      else if (name?.startsWith('get') && name.endsWith('DashboardData')) result = { ok: true, data: { projects: [], tasks: [], events: [], eventInstances: [], todayEvents: [], eventGroups: [], routines: [], routineInstances: [], routineDefinitions: [], routineGroups: [], categories: [], pinnedMemories: [], memoryRecords: [] } };
      else { errors.push(`Unexpected action ${name}`); result = { ok: false, code: 'unavailable', category: 'server', message: 'Unavailable' }; }
      await route.fulfill({ status: 200, contentType: 'text/x-component', body: `0:{"a":"$@1","f":[],"b":"fixture"}\n1:${JSON.stringify(result)}\n` });
    });
    const page = await context.newPage(); page.setDefaultTimeout(60000);
    page.on('pageerror', error => errors.push(error.name));
    await page.goto(`${baseUrl}/settings`);
    const en = language === 'en';
    const opener = page.getByRole('button', { name: en ? 'Open chat' : '打开聊天', exact: true });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: en ? 'Aria Chat' : 'Aria 聊天', exact: true });
    const input = dialog.getByRole('textbox', { name: en ? 'Message' : '消息', exact: true });
    await input.waitFor();
    await dialog.getByText(en ? 'Hello. What’s on your mind?' : '你好，有什么想聊的吗？', { exact: true }).waitFor();
    const send = dialog.getByRole('button', { name: en ? 'Send message' : '发送消息', exact: true });
    const initialHeight = (await input.boundingBox()).height;
    await page.screenshot({ path: `${output}/${language}-${theme}-${width}-empty.png` });
    await input.fill('one\ntwo\nthree\nfour\nfive\nsix\nseven');
    const expandedHeight = (await input.boundingBox()).height;
    assert.ok(expandedHeight > initialHeight && expandedHeight < initialHeight * 5, 'Composer expands but remains bounded');
    if (width < 600) {
      await input.fill('Mobile'); await input.press('Enter'); assert.equal(await input.inputValue(), 'Mobile\n', 'Mobile Enter remains a newline');
    } else {
      await input.fill('Desktop'); await input.press('Shift+Enter'); assert.equal(await input.inputValue(), 'Desktop\n');
    }
    await input.fill('Hello');
    assert.equal((await input.boundingBox()).height, (await send.boundingBox()).height, 'Single-line composer and Send have the same height');
    const layout = await dialog.evaluate(node => {
      const header = getComputedStyle(node.querySelector('header'));
      const footer = getComputedStyle(node.querySelector('[data-chat-composer]'));
      const row = getComputedStyle(node.querySelector('[data-chat-composer] textarea').parentElement);
      return { headerX: header.paddingLeft, footerX: footer.paddingLeft, footerY: footer.paddingTop, gap: row.columnGap };
    });
    assert.deepEqual(layout, { headerX: '16px', footerX: '16px', footerY: '16px', gap: '8px' });
    assert.equal(await dialog.getByText(en ? 'History is kept for 7 days.' : '聊天记录保留 7 天。', { exact: true }).count(), 0);
    await page.waitForFunction(label => document.querySelector(`button[aria-label="${label}"]`)?.disabled === false, en ? 'Send message' : '发送消息');
    if (width < 600) await send.click(); else await input.press('Enter');
    await dialog.getByText(en ? 'Thinking...' : '思考中...', { exact: true }).waitFor();
    const thinkingLayout = await dialog.getByText(en ? 'Thinking...' : '思考中...', { exact: true }).evaluate(node => {
      const probe = document.createElement('span'); probe.style.backgroundColor = 'var(--aa-chat-assistant-bg)';
      node.append(probe);
      const bubble = node.parentElement;
      const result = { background: getComputedStyle(bubble).backgroundColor, expected: getComputedStyle(probe).backgroundColor,
        alignment: getComputedStyle(bubble.parentElement).justifyContent };
      probe.remove(); return result;
    });
    assert.equal(thinkingLayout.background, thinkingLayout.expected);
    assert.equal(thinkingLayout.alignment, 'flex-start', 'Thinking follows the assistant bubble alignment');
    await dialog.getByText('Reply to Hello', { exact: true }).waitFor();
    const assistantColor = await dialog.getByText('Reply to Hello', { exact: true }).evaluate(node => {
      const probe = document.createElement('span'); probe.style.backgroundColor = 'var(--aa-chat-assistant-bg)';
      node.append(probe);
      const colors = [getComputedStyle(node.parentElement).backgroundColor, getComputedStyle(probe).backgroundColor];
      probe.remove(); return colors;
    });
    assert.equal(assistantColor[0], assistantColor[1], 'Aria replies use the neutral chat background token');
    assert.equal(await dialog.getByText('Reply to Hello', { exact: true }).evaluate(node => getComputedStyle(node).fontSize), '16px');
    assert.equal(await dialog.getByText('Reply to Hello', { exact: true }).evaluate(node => getComputedStyle(node.parentElement).maxWidth), '75%');
    assert.deepEqual(await dialog.getByText('Reply to Hello', { exact: true }).evaluate(node => {
      const style = getComputedStyle(node.parentElement);
      return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
    }), ['8px', '16px', '8px', '16px']);
    assert.equal(await dialog.getByText(en ? 'You' : '你', { exact: true }).count(), 0);
    assert.equal(await dialog.getByText('Aria', { exact: true }).count(), 0);
    assert.equal(await dialog.getByText(/\b\d{1,2}:\d{2}\b/).count(), 0, 'Per-message times are not displayed');
    assert.equal(calls, 1);
    const saved = (await repository.list(userId)).entries[0];
    assert.equal((await service.send(userId, saved.id, 'Hello')).ok, true); assert.equal(calls, 1);
    assert.equal(await dialog.getByRole('searchbox').count(), 0);
    assert.equal(await dialog.getByRole('button', { name: en ? 'Search history' : '搜索记录', exact: true }).count(), 0);
    assert.equal((await repository.list(userId, { query: 'Reply to Hello' })).entries.length, 1, 'Backend search remains available but is hidden from the panel');
    reject = true; await input.fill('Retry message'); await send.click();
    const retry = dialog.getByRole('button', { name: en ? 'Retry' : '重试', exact: true }); await retry.waitFor();
    assert.equal(await input.inputValue(), 'Retry message');
    await dialog.getByRole('alert').getByText(en ? 'Too many requests. Please try again later.' : '请求过多，请稍后重试。', { exact: true }).waitFor();
    await retry.click(); await dialog.getByText('Reply to Retry message', { exact: true }).waitFor();
    assert.equal((await repository.list(userId)).entries.length, 2);
    assert.ok((await repository.list(userId)).entries.every(entry => entry.assistantText && !entry.assistantText.includes('Thinking')));
    networkFailure = true; await input.fill('Network retry'); await send.click();
    await dialog.getByRole('alert').getByText(en ? 'Connection failed. Check your network and try again.' : '连接失败，请检查网络后重试。', { exact: true }).waitFor();
    assert.equal(await input.inputValue(), 'Network retry');
    await retry.click(); await dialog.getByText('Reply to Network retry', { exact: true }).waitFor();
    providerError = new GeminiError('request_failed', 401); await input.fill('Configuration error'); await send.click();
    const notice = dialog.getByRole('alert').filter({ hasText: en ? 'Invalid API key. Check your AI settings.' : 'API 密钥无效，请检查 AI 设置。' });
    await notice.waitFor();
    assert.equal(await notice.getByRole('button', { name: en ? 'Settings' : '设置', exact: true }).count(), 1);
    assert.equal(await notice.getByRole('button', { name: en ? 'Retry' : '重试', exact: true }).count(), 0);
    if (width < 600) {
      await page.evaluate(() => {
        Object.defineProperty(window.visualViewport, 'height', { configurable: true, value: 400 });
        window.visualViewport.dispatchEvent(new Event('resize'));
      });
      assert.ok((await input.boundingBox()).y + (await input.boundingBox()).height <= 400, 'Composer stays above the simulated keyboard');
      await page.evaluate(() => { delete window.visualViewport.height; window.visualViewport.dispatchEvent(new Event('resize')); });
    }
    assert.equal(await dialog.evaluate(node => node.scrollWidth > node.clientWidth), false);
    const bounds = await dialog.boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width);
    await page.screenshot({ path: `${output}/${language}-${theme}-${width}.png` });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const transition = await dialog.evaluate(node => {
      const style = getComputedStyle(node);
      return { transform: style.transform, properties: style.transitionProperty };
    });
    assert.equal(transition.transform, 'none');
    assert.ok(transition.properties.includes('opacity') && !transition.properties.includes('transform'), 'Closing fades without scaling or movement');
    await input.press('Escape'); await opener.waitFor({ state: 'visible' });
    assert.equal(await opener.evaluate(node => node === document.activeElement), true);
    await page.reload(); await opener.click(); await dialog.getByText('Reply to Retry message', { exact: true }).waitFor();
    const cache = await page.evaluate(() => JSON.stringify(sessionStorage));
    assert.ok(cache.includes('Reply to Hello')); assert.ok(!cache.includes('test-owned-chat-key'));
    assert.deepEqual(errors, []); await context.close();
  }
  console.log('Chat checks passed: authenticated guards, ownership, persistence, idempotency, pending uniqueness, stale leases, expiry, search, retry, browser cache and responsive keyboard interaction. No Google calls.');
} finally {
  await browser.close();
  for (const id of owners) await sql.query('DELETE FROM users WHERE id = $1', [id]);
}
