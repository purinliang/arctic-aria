import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { chromium } from 'playwright';

// All actions are mocked; this check never writes to the configured database.
const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:3001';
const output = process.env.SCREENSHOT_DIR ?? '/tmp/arctic-aria-personal-tools';
const manifest = JSON.parse(await readFile(new URL('../.next/server/server-reference-manifest.json',import.meta.url),'utf8'));
const names = new Map(Object.entries(manifest.node).map(([id,value]) => [id,value.exportedName]));
await mkdir(output,{ recursive: true });
const owner = '11111111-1111-4111-8111-111111111111';
async function dismissNotifications(page,en) {
  const label = en ? 'Dismiss notification' : '关闭通知';
  const buttons = page.getByRole('button',{ name: label,exact: true });
  while (await buttons.count()) {
    const count = await buttons.count(); await buttons.first().click();
    await page.waitForFunction(({ label,count }) => [...document.querySelectorAll('button')].filter((item) => item.getAttribute('aria-label') === label).length < count,{ label,count });
  }
}
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [1280,390]) for (const language of ['en','zh-CN']) for (const theme of ['light','dark']) {
    const context = await browser.newContext({ viewport: { width,height: 844 },timezoneId: 'Australia/Sydney' });
    const preferences = { languagePreference: language,themePreference: theme,timeZonePreference: 'Australia/Sydney',resolvedTimeZone: 'Australia/Sydney',timeFormatPreference: '24h',multipleTimezonesEnabled: false };
    await context.addInitScript(({ language,theme }) => {
      localStorage.setItem('arctic-aria.language-preference',language); localStorage.setItem('arctic-aria.theme-preference',theme);
    },{ language,theme });
    const today = new Date().toLocaleDateString('en-CA',{ timeZone: 'Australia/Sydney' });
    const categories = ['food','transport','housing','bills','shopping','health','other'].map((seedKey) => ({ id: randomUUID(),seedKey,name: null,archived: false }));
    categories.push(...['Custom A','Custom B'].map((name) => ({ id: randomUUID(),seedKey: null,name,archived: false })));
    let settings = { preferredCurrencies: ['AUD','CNY'],quickCategoryIds: categories.slice(0,5).map((item) => item.id) };
    const expenses = Array.from({ length: 8 },(_,index) => ({ id: randomUUID(),categoryId: categories[0].id,amountMinor: 1230,currency: index === 7 ? 'CNY' : 'AUD',date: today,note: null }));
    const items = ['food','household'].flatMap((kind) => Array.from({ length: 8 },(_,index) => ({
      id: randomUUID(),kind,title: `${kind === 'food' ? 'Food' : 'Household'} fixture ${index + 1}`,note: null,level: 3,spares: 2,version: 1,cycleId: randomUUID(),observations: [],
      quantity: index === 1 ? 0.5 : 1.5,unit: 'kg',increment: 0.5,targetQuantity: 2,lowStockThreshold: 1,
    })));
    const wishlist = Array.from({ length: 8 },(_,index) => ({ id: randomUUID(),title: `Travel fixture ${index + 1}`,country: 'Japan',shop: 'Example shop',url: 'https://example.com/item',note: null,linkedSupplyId: index === 0 ? items[0].id : null,status: 'planned',version: 1 }));
    const failures = [], commands = new Set(); let failExpense = false, failStock = false, moneyReads = 0;
    let moneyGate = null, suppliesGate = null;
    await context.route('**/*',async (route) => {
      const request = route.request(), id = request.headers()['next-action'];
      if (!id) return new URL(request.url()).origin === new URL(baseUrl).origin ? route.continue() : route.abort();
      const name = names.get(id), args = JSON.parse(request.postData() ?? '[]',(_key,value) => value === '$undefined' ? undefined : value);
      let result;
      const unavailable = { ok: false,code: 'unavailable',category: 'database_connection',message: 'Unavailable' };
      if (name === 'getCurrentUser') result = { id: owner,username: 'testusername',displayName: 'Test User',isAdmin: false,expiresAt: Date.now() + 3600000 };
      else if (name === 'getPublicVersionStatus') result = { appVersionText: 'test',actualDatabaseVersionText: 'test',expectedDatabaseVersionText: 'test',aligned: true,message: '' };
      else if (['getUserPreferences','saveResolvedTimeZone'].includes(name)) result = { ok: true,preferences };
      else if (name === 'getMoneyData') {
        moneyReads++;
        if (moneyGate) { const gate = moneyGate; moneyGate = null; await gate; result = unavailable; }
        else result = { ok: true,data: { categories,settings,expenses: expenses.filter((entry) => entry.date.slice(0,7) === args[0].date.slice(0,7)) } };
      } else if (name === 'saveMoneySettings') { settings = args[0]; result = { ok: true,data: true }; }
      else if (name === 'saveExpense') {
        if (failExpense) { failExpense = false; result = unavailable; }
        else {
          const input = args[0], entry = expenses.find((item) => item.id === input.id) ?? { id: input.id };
          Object.assign(entry,{ categoryId: input.categoryId,amountMinor: Math.round(Number(input.amount) * (input.currency === 'JPY' ? 1 : 100)),currency: input.currency,date: input.date,note: input.note || null });
          if (!expenses.some((item) => item.id === entry.id)) expenses.unshift(entry);
          result = { ok: true,data: true };
        }
      } else if (name === 'saveMoneyCategory') {
        const input = args[0], category = categories.find((item) => item.id === input.id) ?? { id: input.id,seedKey: null,archived: false };
        assert.equal(category.seedKey,null); Object.assign(category,{ name: input.name });
        if (!categories.some((item) => item.id === category.id)) categories.push(category); result = { ok: true,data: true };
      } else if (name === 'reorderMoneyCategories') {
        const reordered = args[0].map((id) => categories.find((item) => item.id === id));
        assert.ok(reordered.every((item) => item.seedKey === null));
        const fixed = categories.filter((item) => item.seedKey !== null);
        categories.splice(0,categories.length,...fixed,...reordered); result = { ok: true,data: true };
      } else if (name === 'getSuppliesData') {
        if (suppliesGate) { const gate = suppliesGate; suppliesGate = null; await gate; result = unavailable; }
        else result = { ok: true,data: { items,wishlist } };
      } else if (name === 'adjustSupplyQuantity') {
        await new Promise((resolve) => setTimeout(resolve,150));
        const input = args[0], item = items.find((item) => item.id === input.id); assert.ok(item);
        if (failStock) { failStock = false; result = unavailable; }
        else {
          if (!commands.has(input.key)) { commands.add(input.key); item.version++; item.quantity = Math.max(0,Math.round(item.quantity * 1000) + input.direction * Math.round(item.increment * 1000)) / 1000; }
          result = { ok: true,data: item };
        }
      } else if (name === 'saveSupply') {
        const input = args[0]; let item = items.find((item) => item.id === input.id);
        if (!item) { item = { id: input.id,cycleId: randomUUID(),observations: [],version: 1 }; items.unshift(item); }
        Object.assign(item,input,{ note: input.note || null }); result = { ok: true,data: item };
      } else if (name === 'saveWish') {
        const input = args[0]; let item = wishlist.find((item) => item.id === input.id);
        if (!item) { item = { id: input.id }; wishlist.unshift(item); }
        Object.assign(item,input,{ version: input.version + 1 }); result = { ok: true,data: item };
      } else if (name === 'getIdeaPageData') result = { ok: true,data: [] };
      else if (name?.startsWith('get') && name.endsWith('DashboardData')) result = { ok: true,data: { projects: [],tasks: [],events: [],eventInstances: [],todayEvents: [],eventGroups: [],routines: [],routineInstances: [],routineDefinitions: [],routineGroups: [],categories: [],pinnedMemories: [],memoryRecords: [] } };
      else { failures.push(`Unexpected action ${name}`); result = unavailable; }
      await route.fulfill({ status: 200,contentType: 'text/x-component',body: `0:{"a":"$@1","f":[],"b":"fixture"}\n1:${JSON.stringify(result)}\n` });
    });
    const page = await context.newPage(); page.on('pageerror',(error) => failures.push(error.message));
    const en = language === 'en', save = en ? 'Save' : '保存', newExpense = en ? 'New expense' : '新增支出';
    const button = (name) => page.getByRole('button',{ name,exact: true });
    const lastDialog = () => page.locator('.aa-dialog-overlay').last();
    await page.goto(`${baseUrl}/money`); await button(newExpense).waitFor();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((item) => item.textContent.trim() === label && !item.disabled),newExpense);
    await button(newExpense).click();
    assert.equal(await lastDialog().getByRole('radio').count(),8,'six categories and two preferred currencies');
    await page.screenshot({ path: `${output}/expense-entry-${width}-${language}-${theme}.png`,fullPage: true });
    await button(en ? 'Currencies' : '货币').click();
    await button(`${en ? 'Move up' : '上移'}: CNY`).click(); await lastDialog().getByRole('button',{ name: save,exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.aa-dialog-overlay').length === 1);
    await page.getByRole('radio',{ name: 'CNY',exact: true }).click();
    await page.getByLabel(en ? 'Amount' : '金额',{ exact: true }).fill('45.67');
    failExpense = true; await button(save).click();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((item) => item.textContent.trim() === label && !item.disabled),save);
    assert.equal(expenses.length,8); assert.equal(await page.getByLabel(en ? 'Amount' : '金额',{ exact: true }).inputValue(),'45.67');
    await button(save).click(); await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' }); assert.equal(expenses.length,9);
    const reads = moneyReads; await page.getByRole('tab',{ name: en ? 'Day' : '日',exact: true }).click();
    await page.getByRole('tab',{ name: en ? 'Month' : '月',exact: true }).click(); assert.equal(moneyReads,reads,'day/month share one monthly cache');
    await button(en ? 'Categories' : '分类').and(page.locator('button:not([aria-haspopup])')).click();
    assert.equal(await lastDialog().getByRole('button',{ name: `${en ? 'Edit' : '编辑'}: ${en ? 'Food' : '饮食'}`,exact: true }).count(),0,'built-in categories have no edit action');
    await button(`${en ? 'Move up' : '上移'}: Custom B`).click();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((item) => item.getAttribute('aria-label') === label && item.disabled),`${en ? 'Move up' : '上移'}: Custom B`);
    assert.equal(categories.filter((item) => item.seedKey === null)[0].name,'Custom B');
    await button(en ? 'New' : '新建').click(); await page.getByLabel(en ? 'Name' : '名称',{ exact: true }).fill('Category fixture');
    await lastDialog().getByRole('button',{ name: save,exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.aa-dialog-overlay').length === 1);
    await lastDialog().getByRole('button',{ name: en ? 'Close' : '关闭',exact: true }).click();
    await button(newExpense).click(); await page.getByRole('radio',{ name: en ? 'Other' : '其他',exact: true }).click();
    await button(en ? 'Custom categories' : '自定义分类').click(); await page.getByRole('option',{ name: 'Custom B',exact: true }).click();
    await page.getByLabel(en ? 'Amount' : '金额',{ exact: true }).fill('10'); await button(save).click();
    await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' }); assert.equal(expenses[0].categoryId,categories.find((item) => item.name === 'Custom B').id);
    const moneyKey = `arctic-aria.money-browser-cache.v1.${owner}`, suppliesKey = `arctic-aria.supplies-browser-cache.v2.${owner}`;
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? '{}').views?.some((view) => view.data.expenses.length === 10),moneyKey);
    let releaseMoney; moneyGate = new Promise((resolve) => { releaseMoney = resolve; });
    await page.reload(); await button(newExpense).waitFor(); assert.equal(await button(newExpense).isEnabled(),true); releaseMoney();
    await dismissNotifications(page,en);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'Money fits viewport');
    await page.screenshot({ path: `${output}/money-${width}-${language}-${theme}.png`,fullPage: true });
    await page.goto(`${baseUrl}/supplies`);
    await button(en ? 'Type' : '类型').click(); await page.getByRole('option',{ name: en ? 'Food' : '食品',exact: true }).click();
    const minus = button(`${en ? 'Decrease' : '减少'}: Food fixture 1`), plus = button(`${en ? 'Increase' : '增加'}: Food fixture 1`);
    await minus.waitFor(); failStock = true; await minus.click();
    assert.equal(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).data.items.find((item) => item.title === 'Food fixture 1').quantity,suppliesKey),1.5,'pending changes never enter cache');
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((item) => item.getAttribute('aria-label') === label && !item.disabled),`${en ? 'Decrease' : '减少'}: Food fixture 1`);
    assert.equal(items[0].quantity,1.5); await minus.click();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((item) => item.getAttribute('aria-label') === label && !item.disabled),`${en ? 'Increase' : '增加'}: Food fixture 1`);
    assert.equal(items[0].quantity,1,'fractional decrement');
    for (let index = 0; index < 3; index++) {
      await plus.click(); await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((item) => item.getAttribute('aria-label') === label && !item.disabled),`${en ? 'Increase' : '增加'}: Food fixture 1`);
    }
    assert.equal(items[0].quantity,2.5,'stock can exceed target');
    await button(en ? 'New' : '新建').click(); await page.getByLabel(en ? 'Title' : '名称',{ exact: true }).fill('Added rice fixture');
    for (const [label,value] of [[en ? 'Unit' : '单位','kg'],[en ? 'Current quantity' : '当前数量','1.5'],[en ? 'Quantity step' : '数量步长','0.5'],[en ? 'Target stock' : '目标库存','3'],[en ? 'Low-stock threshold' : '低库存阈值','1']]) await page.getByLabel(label,{ exact: true }).fill(value);
    await page.screenshot({ path: `${output}/supply-config-${width}-${language}-${theme}.png`,fullPage: true });
    await button(save).click(); await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? '{}').data?.items.length === 17,suppliesKey);
    let releaseSupplies; suppliesGate = new Promise((resolve) => { releaseSupplies = resolve; });
    await page.reload(); await button('Added rice fixture').waitFor(); assert.equal(await button(en ? 'New' : '新建').isEnabled(),true); releaseSupplies();
    await page.getByRole('radio',{ name: new RegExp(`^${en ? 'Need restock' : '需要补货'}`) }).click();
    assert.equal(await button('Added rice fixture').count(),0,'normal stock remains visible until restock filter selected');
    await page.getByRole('radio',{ name: en ? 'All supplies' : '全部物资',exact: true }).click();
    await dismissNotifications(page,en);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'Supplies fits viewport');
    await page.screenshot({ path: `${output}/supplies-${width}-${language}-${theme}.png`,fullPage: true });
    await button(en ? 'Type' : '类型').click(); await page.getByRole('option',{ name: en ? 'Travel shopping' : '旅行购物',exact: true }).click();
    const stockBeforePurchase = JSON.stringify(items);
    await button(`${en ? 'Mark purchased' : '标记已购买'}: Travel fixture 1`).click();
    await button(`${en ? 'Mark planned' : '标记计划采购'}: Travel fixture 1`).waitFor();
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key))?.data.wishlist.some((item) => item.title === 'Travel fixture 1' && item.status === 'purchased'),suppliesKey);
    assert.equal(JSON.stringify(items),stockBeforePurchase); assert.equal(expenses.length,10); assert.deepEqual(failures,[]);
    await context.close();
  }
  console.log('Personal tools matrix passed: compact expense capture, fixed/custom categories, ordering, currencies, quantity steps/thresholds, excess stock, confirmed-only caches, failed refreshes, and responsive layouts.');
} finally { await browser.close(); }
