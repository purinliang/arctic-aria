import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:3001';
const output = process.env.SCREENSHOT_DIR ?? '/tmp/arctic-aria-personal-tools';
const manifest = JSON.parse(await readFile(new URL('../.next/server/server-reference-manifest.json', import.meta.url), 'utf8'));
const names = new Map(Object.entries(manifest.node).map(([id, value]) => [id, value.exportedName]));
await mkdir(output, { recursive: true });
async function dismissNotifications(page,en) {
  const label = en ? 'Dismiss notification' : '关闭通知';
  const buttons = page.getByRole('button',{ name: label,exact: true });
  while (await buttons.count()) {
    const count = await buttons.count();
    await buttons.first().click();
    await page.waitForFunction(({ label,count }) => [...document.querySelectorAll('button')].filter((button) => button.getAttribute('aria-label') === label).length < count,{ label,count });
  }
}
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
    let failStock = false;
    const commands = new Set();
    const histories = new Map();
    const items = ['food','household'].flatMap((kind) => Array.from({ length: 8 },(_,index) => {
      const id = randomUUID(), cycleId = randomUUID();
      const observations = [5,4,3].map((level,index) => ({ id: randomUUID(),cycleId,level,recordedAt: new Date(Date.now() - (6-index*2)*86400_000).toISOString() }));
      histories.set(id,[...observations]);
      return { id,kind,title: `${kind === 'food' ? 'Food' : 'Household'} fixture ${index+1}`,note: index === 0 ? 'Supply fixture '.repeat(12) : null,level: 3,spares: 2,version: 1,cycleId,observations };
    }));
    const wishlist = Array.from({ length: 8 },(_,index) => ({ id: randomUUID(),title: `Travel fixture ${index+1}`,country: 'Japan',shop: 'Example shop',url: 'https://example.com/item',note: null,linkedSupplyId: index === 0 ? items[0].id : null,status: 'planned',version: 1 }));
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
      else if (name === 'getSuppliesData') result = { ok: true,data: { items,wishlist } };
      else if (name === 'getSupplyHistory') result = { ok: true,data: [...(histories.get(args[0]) ?? [])].reverse() };
      else if (name === 'changeSupply') {
        await new Promise((resolve) => setTimeout(resolve,150));
        const input = args[0], item = items.find((item) => item.id === input.id);
        assert.ok(item);
        if (failStock) { failStock = false; result = { ok: false,code: 'unavailable',category: 'database_update',message: 'Unavailable' }; }
        else {
          if (!commands.has(input.key)) {
            commands.add(input.key); item.version++;
            if (input.operation === 'replace') { item.level = 5; item.cycleId = randomUUID(); if (input.useSpare) item.spares--; }
            else item.level = input.level;
            const point = { id: randomUUID(),cycleId: item.cycleId,level: item.level,recordedAt: new Date().toISOString() };
            histories.get(item.id).push(point);
            item.observations = histories.get(item.id).filter((point) => point.cycleId === item.cycleId).slice(-3);
          }
          result = { ok: true,data: item };
        }
      } else if (name === 'saveSupply') {
        const input = args[0];
        let item = items.find((item) => item.id === input.id);
        if (!item) { item = { id: input.id,cycleId: randomUUID(),observations: [],version: 1 }; items.unshift(item); }
        Object.assign(item,{ kind: input.kind,title: input.title,note: input.note || null,spares: input.spares,level: item.level ?? input.level });
        if (!histories.has(item.id)) { const point = { id: randomUUID(),cycleId: item.cycleId,level: item.level,recordedAt: new Date().toISOString() }; item.observations = [point]; histories.set(item.id,[point]); }
        result = { ok: true,data: item };
      } else if (name === 'saveWish') {
        const input = args[0]; let item = wishlist.find((item) => item.id === input.id);
        if (!item) { item = { id: input.id }; wishlist.unshift(item); }
        Object.assign(item,input,{ version: input.version+1 }); result = { ok: true,data: item };
      } else if (name === 'archiveSupply') {
        const input = args[0], list = input.wishlist ? wishlist : items;
        list.splice(list.findIndex((item) => item.id === input.id),1); result = { ok: true,data: true };
      }
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
    await page.getByRole('button',{ name: en ? 'Categories' : '分类',exact: true }).and(page.locator('button:not([aria-haspopup="listbox"])')).click();
    await page.getByRole('button',{ name: `${en ? 'Quick capture' : '快速记录'}: ${food}`,exact: true }).click();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((button) => button.getAttribute('aria-label') === label && button.getAttribute('aria-pressed') === 'false' && !button.disabled),`${en ? 'Quick capture' : '快速记录'}: ${food}`);
    const manager = page.locator('.aa-dialog-overlay').first();
    await manager.getByRole('button',{ name: en ? 'New' : '新建',exact: true }).click();
    await page.getByLabel(en ? 'Name' : '名称',{ exact: true }).fill('Category fixture');
    await page.getByRole('button',{ name: save,exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.aa-dialog-overlay').length === 1);
    await manager.getByRole('button',{ name: en ? 'Next page' : '下一页',exact: true }).click();
    await page.getByRole('button',{ name: `${en ? 'Quick capture' : '快速记录'}: Category fixture`,exact: true }).click();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((button) => button.getAttribute('aria-label') === label && button.getAttribute('aria-pressed') === 'true' && !button.disabled),`${en ? 'Quick capture' : '快速记录'}: Category fixture`);
    assert.equal(settings.quickCategoryIds.length,5);
    assert.ok(settings.quickCategoryIds.includes(categories.find((category) => category.name === 'Category fixture').id));
    await manager.getByRole('button',{ name: en ? 'Close' : '关闭',exact: true }).click();
    await dismissNotifications(page,en);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Money must fit viewport');
    await page.screenshot({ path: `${output}/money-${width}-${language}-${theme}.png`, fullPage: true });
    await page.reload(); await page.getByRole('button', { name: 'Category fixture', exact: true }).waitFor();
    await page.goto(`${baseUrl}/supplies`);
    const remaining = en ? 'Remaining' : '剩余量';
    const stockName = `${remaining}: Food fixture 1`;
    const level2 = page.getByRole('radio',{ name: `${stockName}: 2/5`,exact: true });
    await level2.waitFor();
    await page.getByRole('button',{ name: en ? 'Next page' : '下一页',exact: true }).click();
    await page.getByText('Food fixture 7 · +2',{ exact: true }).waitFor();
    await page.getByRole('button',{ name: en ? 'First page' : '第一页',exact: true }).click();
    failStock = true; await level2.click();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((button) => button.getAttribute('aria-label') === label && !button.disabled),`${stockName}: 2/5`);
    assert.equal(items[0].level,3,'failed observation must roll back');
    await level2.click();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((button) => button.getAttribute('aria-label') === label && !button.disabled),`${stockName}: 2/5`);
    assert.equal(items[0].level,2); assert.equal(await level2.getAttribute('aria-checked'),'true');
    await page.getByRole('button',{ name: `${en ? 'Replace' : '替换'}: Food fixture 1`,exact: true }).click();
    assert.equal(await page.getByRole('checkbox').isChecked(),true);
    await page.getByRole('button',{ name: en ? 'Replace' : '替换',exact: true }).click();
    await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
    assert.equal(items[0].level,5); assert.equal(items[0].spares,1); assert.equal(items[0].observations.length,1);
    await page.getByRole('button',{ name: `${en ? 'Usage history' : '使用记录'}: Food fixture 1`,exact: true }).click();
    await page.getByText(en ? 'Current item' : '当前物资',{ exact: true }).waitFor();
    await page.getByRole('button',{ name: en ? 'Close' : '关闭',exact: true }).click();
    await page.getByRole('button',{ name: en ? 'New' : '新建',exact: true }).click();
    await page.getByLabel(en ? 'Title' : '名称',{ exact: true }).fill('Added food fixture');
    await page.getByLabel(en ? 'Unopened spares' : '未开封备用数量',{ exact: true }).fill('1');
    await page.getByRole('button',{ name: save,exact: true }).click();
    await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
    assert.equal(items.filter((item) => item.kind === 'food').length,9);
    await page.getByRole('radio',{ name: en ? 'Needs attention' : '需要关注',exact: true }).click();
    assert.equal(await page.getByText('Added food fixture · +1',{ exact: true }).count(),0,'full replacement must not need attention');
    await page.getByRole('radio',{ name: en ? 'All' : '全部',exact: true }).click();
    await dismissNotifications(page,en);
    for (const tab of [en ? 'Food' : '食品',en ? 'Household' : '日用品',en ? 'Travel shopping' : '旅行购物']) {
      await page.getByRole('tab',{ name: tab,exact: true }).click();
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'Supplies must fit viewport');
      await page.screenshot({ path: `${output}/supplies-${tab === (en ? 'Travel shopping' : '旅行购物') ? 'travel' : tab === (en ? 'Food' : '食品') ? 'food' : 'household'}-${width}-${language}-${theme}.png`,fullPage: true });
    }
    await page.getByRole('button',{ name: en ? 'New' : '新建',exact: true }).click();
    await page.getByLabel(en ? 'Title' : '名称',{ exact: true }).fill('Added travel fixture');
    await page.getByLabel(en ? 'Buy in' : '采购国家',{ exact: true }).fill('China');
    await page.getByLabel(en ? 'Link' : '链接',{ exact: true }).fill('https://example.com/fixture');
    await page.getByRole('button',{ name: en ? 'Linked supply' : '关联物资',exact: true }).click();
    await page.getByRole('option',{ name: 'Food fixture 1',exact: true }).click();
    await page.getByRole('button',{ name: save,exact: true }).click();
    await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
    assert.equal(wishlist[0].title,'Added travel fixture');
    assert.equal(wishlist[0].linkedSupplyId,items.find((item) => item.title === 'Food fixture 1').id);
    const stockBeforePurchase = JSON.stringify(items);
    await page.getByRole('button',{ name: `${en ? 'Mark purchased' : '标记已购买'}: Travel fixture 1`,exact: true }).click();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((button) => button.getAttribute('aria-label') === label && !button.disabled),`${en ? 'Mark planned' : '标记计划采购'}: Travel fixture 1`);
    assert.equal(wishlist.find((item) => item.title === 'Travel fixture 1').status,'purchased'); assert.equal(JSON.stringify(items),stockBeforePurchase,'wishlist must not change stock');
    assert.equal(expenses.length,9,'wishlist must not create expenses');
    assert.deepEqual(failures, []);
    await context.close();
  }
  console.log('Personal tools browser matrix passed: Money capture/currencies/retries and Supplies tabs, pagination, stock rollback, replacement, history, capture, and wishlist isolation.');
} finally { await browser.close(); }
