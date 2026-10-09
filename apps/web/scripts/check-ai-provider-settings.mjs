import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

// Mocked server actions: no database writes or Google API calls.
const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:3001';
const output = '/tmp/arctic-aria-ai-settings';
const manifest = JSON.parse(await readFile(new URL('../.next/server/server-reference-manifest.json',import.meta.url),'utf8'));
const names = new Map(Object.entries(manifest.node).map(([id,value]) => [id,value.exportedName]));
await mkdir(output,{ recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1280,390,320]) for (const language of ['en','zh-CN']) for (const theme of ['light','dark']) {
    const context = await browser.newContext({ viewport: { width,height: 900 } });
    const preferences = { languagePreference: language,themePreference: theme,timeZonePreference: 'system',resolvedTimeZone: null,timeFormatPreference: '24h',multipleTimezonesEnabled: false };
    await context.addInitScript(({ language,theme }) => {
      localStorage.setItem('arctic-aria.language-preference',language);
      localStorage.setItem('arctic-aria.theme-preference',theme);
    },{ language,theme });
    let status = { enabled: false,provider: 'google_gemini',hasKey: false };
    let failSave = false, saves = 0, tests = 0;
    const failures = [];
    await context.route('**/*',async route => {
      const request = route.request(), id = request.headers()['next-action'];
      if (!id) return new URL(request.url()).origin === new URL(baseUrl).origin ? route.continue() : route.abort();
      const name = names.get(id), args = JSON.parse(request.postData() ?? '[]',(_key,value) => value === '$undefined' ? undefined : value);
      let result;
      if (name === 'getCurrentUser') result = { id: '11111111-1111-4111-8111-111111111111',username: 'testusername',displayName: 'Test User',isAdmin: false,expiresAt: Date.now() + 3600000 };
      else if (name === 'getPublicVersionStatus') result = { appVersionText: 'test',actualDatabaseVersionText: 'test',expectedDatabaseVersionText: 'test',aligned: true,message: '' };
      else if (['getUserPreferences','saveResolvedTimeZone'].includes(name)) result = { ok: true,preferences };
      else if (name === 'getDiscordBinding') result = { ok: true,binding: null };
      else if (name === 'getIdeaPageData') result = { ok: true,data: [] };
      else if (name === 'getAIProviderSettings') result = { ok: true,data: status };
      else if (name === 'saveAIProviderSettings') {
        saves++;
        await new Promise(resolve => setTimeout(resolve,100));
        if (failSave) { failSave = false; result = { ok: false,category: 'database_update',code: 'ai_unavailable',message: 'Unavailable' }; }
        else {
          const input = args[0];
          assert.equal(input.provider,'google_gemini');
          status = { enabled: input.enabled,provider: input.provider,hasKey: input.removeKey ? false : Boolean(input.apiKey) || status.hasKey };
          result = { ok: true,data: status };
        }
      } else if (name === 'testAIProvider') {
        tests++;
        assert.equal(args[0],'test-fixture-api-key');
        result = { ok: false,category: 'domain',code: 'ai_key_rejected',message: 'Key rejected' };
      } else if (name?.startsWith('get') && name.endsWith('DashboardData')) {
        result = { ok: true,data: { projects: [],tasks: [],events: [],eventInstances: [],todayEvents: [],eventGroups: [],routines: [],routineInstances: [],routineDefinitions: [],routineGroups: [],categories: [],pinnedMemories: [],memoryRecords: [] } };
      } else { failures.push(`Unexpected action: ${name}`); result = { ok: false,category: 'server',message: 'Unavailable' }; }
      await route.fulfill({ status: 200,contentType: 'text/x-component',body: `0:{"a":"$@1","f":[],"b":"fixture"}\n1:${JSON.stringify(result)}\n` });
    });
    const page = await context.newPage();
    page.on('pageerror',error => failures.push(error.name));
    const en = language === 'en';
    await page.goto(`${baseUrl}/settings`);
    const input = page.getByLabel(en ? 'API key' : 'API 密钥',{ exact: true });
    const provider = page.getByRole('button',{ name: en ? 'Provider' : '提供商',exact: true });
    async function selectProvider(label) {
      await provider.click(); await page.getByRole('option',{ name: label,exact: true }).click();
    }
    await provider.waitFor();
    await page.waitForFunction(label => !document.querySelector(`button[aria-label="${label}"]`)?.disabled,en ? 'Provider' : '提供商');
    assert.equal(await input.count(),0,'Disabled hides the key row');
    assert.equal(await page.getByRole('switch',{ name: en ? 'Enable AI' : '启用 AI' }).count(),0);
    await selectProvider('Google Gemini');
    await input.waitFor(); await page.waitForFunction(label => !document.querySelector(`input[aria-label="${label}"]`)?.disabled,en ? 'API key' : 'API 密钥');
    assert.equal(await input.getAttribute('type'),'password');
    const save = page.getByRole('button',{ name: en ? 'Save' : '保存',exact: true });
    const test = page.getByRole('button',{ name: en ? 'Test' : '测试',exact: true });
    await input.fill('test-fixture-api-key');
    await test.click(); assert.equal(tests,1); assert.equal(saves,0);
    failSave = true; await save.click();
    await page.waitForFunction(label => ![...document.querySelectorAll('button')].find(node => node.textContent.trim() === label)?.disabled,en ? 'Save' : '保存');
    assert.equal(await input.inputValue(),'test-fixture-api-key');
    await save.click(); await page.waitForFunction(label => document.querySelector(`input[aria-label="${label}"]`)?.value === '',en ? 'API key' : 'API 密钥');
    assert.equal(status.enabled,true); assert.equal(status.hasKey,true);
    const storage = await page.evaluate(() => JSON.stringify({ ...localStorage,...sessionStorage }));
    assert.ok(!storage.includes('test-fixture-api-key'));
    assert.equal(await test.isDisabled(),true,'Test never falls back to the saved key');
    failSave = true;
    await selectProvider(en ? 'Disabled' : '禁用');
    await input.waitFor();
    await page.waitForFunction(label => !document.querySelector(`input[aria-label="${label}"]`)?.disabled,en ? 'API key' : 'API 密钥');
    assert.equal(status.enabled,true,'Failed disable rolls back provider selection');
    await selectProvider(en ? 'Disabled' : '禁用');
    await input.waitFor({ state: 'detached' });
    await page.waitForFunction(label => !document.querySelector(`button[aria-label="${label}"]`)?.disabled,en ? 'Provider' : '提供商');
    assert.equal(status.enabled,false); assert.equal(status.hasKey,true);
    await page.reload(); await provider.waitFor();
    await page.waitForFunction(label => !document.querySelector(`button[aria-label="${label}"]`)?.disabled,en ? 'Provider' : '提供商');
    assert.equal(await input.count(),0);
    await selectProvider('Google Gemini'); await input.waitFor();
    await page.waitForFunction(label => !document.querySelector(`input[aria-label="${label}"]`)?.disabled,en ? 'API key' : 'API 密钥');
    assert.equal(status.enabled,true); assert.equal(status.hasKey,true);
    assert.equal(await input.inputValue(),'');
    await page.getByRole('button',{ name: en ? 'Remove API key' : '移除 API 密钥',exact: true }).click();
    await page.getByRole('button',{ name: en ? 'Remove API key' : '移除 API 密钥',exact: true }).waitFor({ state: 'detached' });
    assert.equal(status.enabled,false); assert.equal(status.hasKey,false);
    await selectProvider('Google Gemini'); await input.waitFor();
    assert.equal(await test.isDisabled(),true);
    const rectangles = await Promise.all([input,test,save].map(control => control.boundingBox()));
    assert.ok(rectangles.every(rect => rect.height === rectangles[0].height),'Input and actions share one height');
    assert.ok(rectangles.every(rect => Math.abs(rect.y - rectangles[0].y) < 1),'Actions remain on the input row');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'no horizontal overflow');
    const dismiss = page.getByRole('button',{ name: en ? 'Dismiss notification' : '关闭通知',exact: true });
    await dismiss.evaluateAll(buttons => buttons.forEach(button => button.click()));
    await page.waitForFunction(label => !document.querySelector(`button[aria-label="${label}"]`),en ? 'Dismiss notification' : '关闭通知');
    await input.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${output}/${language}-${theme}-${width}.png`,fullPage: true });
    assert.deepEqual(failures,[]);
    await context.close();
  }
  console.log('AI settings UI checks passed: languages/themes, mobile/desktop, masked keys, save rollback, test, removal and no browser credential storage.');
} finally { await browser.close(); }
