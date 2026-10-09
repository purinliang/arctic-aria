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
  for (const width of [1280,820,390]) for (const language of ['en','zh-CN']) for (const theme of ['light','dark']) {
    const context = await browser.newContext({ viewport: { width,height: 844 },timezoneId: 'Australia/Sydney',hasTouch: width === 390 });
    const preferences = { languagePreference: language,themePreference: theme,timeZonePreference: 'Australia/Sydney',resolvedTimeZone: 'Australia/Sydney',timeFormatPreference: '24h',multipleTimezonesEnabled: false };
    await context.addInitScript(({ language,theme }) => {
      localStorage.setItem('arctic-aria.language-preference',language); localStorage.setItem('arctic-aria.theme-preference',theme);
    },{ language,theme });
    const today = new Date().toLocaleDateString('en-CA',{ timeZone: 'Australia/Sydney' });
    const project = { id: randomUUID(),title: 'Project fixture',description: 'Neutral project fixture',startDate: today,deadlineDate: '',expectedDurationDays: '',durationRange: 'open',sidebarPinOrder: null,timelineText: '',currentMilestone: '',progressText: '',tasks: [],milestones: [] };
    const categories = ['food','transport','shopping','housing','bills','health','subscription','other'].map((seedKey) => ({ id: randomUUID(),seedKey,name: null,archived: false }));
    categories.push(...['Custom A','Custom B'].map((name) => ({ id: randomUUID(),seedKey: null,name,archived: false })));
    let settings = { preferredCurrencies: ['CNY','AUD'],quickCategoryIds: categories.slice(0,5).map((item) => item.id) };
    const expenses = Array.from({ length: 8 },(_,index) => ({ id: randomUUID(),categoryId: categories[0].id,amountMinor: 1230,currency: index === 7 ? 'CNY' : 'AUD',date: today,note: index < 3 ? 'Snacks' : null }));
    const noteUsage = () => expenses.filter((entry) => entry.note).map((entry) => ({ categoryId: entry.categoryId,note: entry.note,count: 1 }));
    const items = ['food','household'].flatMap((kind) => Array.from({ length: 8 },(_,index) => ({
      id: randomUUID(),kind,title: `${kind === 'food' ? 'Food' : 'Household'} fixture ${index + 1}`,note: null,level: 3,spares: 2,version: 1,cycleId: randomUUID(),observations: [],
      quantity: index === 1 ? 0.5 : 5,unit: index === 1 ? 'kg' : 'unit',increment: index === 1 ? 0.5 : 1,targetQuantity: index === 1 ? 2 : 5,lowStockThreshold: 1,
    })));
    const wishlist = Array.from({ length: 8 },(_,index) => ({ id: randomUUID(),title: `Travel fixture ${index + 1}`,country: 'Japan',shop: 'Example shop',url: 'https://example.com/item',note: null,linkedSupplyId: index === 0 ? items[0].id : null,status: 'planned',version: 1 }));
    const failures = [], commands = new Set(); let failExpense = false, failStock = 0, moneyReads = 0;
    let moneyGate = null, suppliesGate = null, stockGate = null, stockWrites = 0;
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
        else result = { ok: true,data: { categories,settings,noteUsage: noteUsage(),expenses: expenses.filter((entry) => entry.date.slice(0,7) === args[0].date.slice(0,7)) } };
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
        if (failStock) { failStock--; result = unavailable; }
        else {
          if (!commands.has(input.key)) { commands.add(input.key); item.version++; item.quantity = Math.max(0,Math.round(item.quantity * 1000) + input.direction * Math.round(item.increment * 1000)) / 1000; }
          result = { ok: true,data: item };
        }
      } else if (name === 'saveSupply') {
        stockWrites++;
        if (stockGate) { const gate = stockGate; stockGate = null; await gate; }
        if (failStock) { failStock--; result = unavailable; }
        else {
          const input = args[0]; let item = items.find((item) => item.id === input.id);
          if (item) assert.equal(input.version,item.version,'queued writes use the latest confirmed backend version');
          if (!item) { item = { id: input.id,cycleId: randomUUID(),observations: [],version: 0 }; items.unshift(item); }
          Object.assign(item,input,{ note: input.note || null,version: item.version + 1 }); result = { ok: true,data: item };
        }
      } else if (name === 'archiveSupply') {
        const input = args[0], index = items.findIndex((item) => item.id === input.id);
        assert.ok(index >= 0); assert.equal(input.wishlist,false); assert.equal(input.version,items[index].version);
        items.splice(index,1); result = { ok: true,data: true };
      } else if (name === 'saveWish') {
        const input = args[0]; let item = wishlist.find((item) => item.id === input.id);
        if (!item) { item = { id: input.id }; wishlist.unshift(item); }
        Object.assign(item,input,{ version: input.version + 1 }); result = { ok: true,data: item };
      } else if (name === 'getIdeaPageData') result = { ok: true,data: [] };
      else if (name?.startsWith('get') && name.endsWith('DashboardData')) result = { ok: true,data: { projects: [project],tasks: [],events: [],eventInstances: [],todayEvents: [],eventGroups: [],routines: [],routineInstances: [],routineDefinitions: [],routineGroups: [],categories: [],pinnedMemories: [],memoryRecords: [] } };
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
    assert.equal(await lastDialog().getByRole('radio').count(),10,'five primary categories and all five currencies');
    assert.equal(await page.getByRole('radio',{ name: 'AUD',exact: true }).getAttribute('aria-checked'),'true','AUD ignores legacy preferred order');
    assert.equal(await lastDialog().getByRole('button',{ name: en ? 'More' : '更多',exact: true }).count(),1,'More is an action, not a category');
    await button(en ? 'Groceries' : '杂货').click();
    assert.equal(await page.getByLabel(en ? 'Note' : '备注',{ exact: true }).inputValue(),en ? 'Groceries' : '杂货');
    await page.screenshot({ path: `${output}/expense-entry-${width}-${language}-${theme}.png`,fullPage: true });
    await page.getByRole('radio',{ name: 'CNY',exact: true }).click();
    await page.getByLabel(en ? 'Amount' : '金额',{ exact: true }).fill('45.67');
    failExpense = true; await button(save).click();
    await page.waitForFunction((label) => [...document.querySelectorAll('button')].some((item) => item.textContent.trim() === label && !item.disabled),save);
    assert.equal(expenses.length,8); assert.equal(await page.getByLabel(en ? 'Amount' : '金额',{ exact: true }).inputValue(),'45.67');
    await button(save).click(); await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' }); assert.equal(expenses.length,9);
    const reads = moneyReads;
    await page.getByRole('tab',{ name: en ? 'Transport' : '交通',exact: true }).click();
    await page.getByText('AUD 0.00',{ exact: true }).waitFor(); assert.equal(moneyReads,reads,'category filtering uses the monthly snapshot');
    await page.getByRole('tab',{ name: en ? 'All' : '全部',exact: true }).click();
    await button(en ? 'Previous month' : '上个月').click(); await page.getByText('AUD 0.00',{ exact: true }).waitFor();
    await button(en ? 'Next month' : '下个月').click(); await page.getByText('AUD 86.10',{ exact: true }).waitFor();
    await button(newExpense).click();
    await page.getByLabel(en ? 'Note' : '备注',{ exact: true }).fill('Manual fixture');
    await button(en ? 'More' : '更多').click();
    await page.getByRole('radio',{ name: en ? 'Subscription' : '订阅',exact: true }).click();
    assert.equal(await page.getByLabel(en ? 'Note' : '备注',{ exact: true }).inputValue(),'Manual fixture','category change preserves note');
    await button('AI').waitFor();
    await button(en ? 'New category' : '新建分类').click(); await page.getByLabel(en ? 'Name' : '名称',{ exact: true }).fill('Category fixture');
    await button(en ? 'Create' : '创建').click();
    await page.getByRole('radio',{ name: 'Category fixture',exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector('button[role="radio"][aria-checked="true"]')?.textContent.includes('Category fixture'));
    await page.getByLabel(en ? 'Amount' : '金额',{ exact: true }).fill('10'); await button(save).click();
    await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' }); assert.equal(expenses[0].categoryId,categories.find((item) => item.name === 'Category fixture').id);
    await page.getByRole('tab',{ name: 'Category fixture',exact: true }).click();
    assert.equal(await page.getByText('AUD 10.00',{ exact: true }).count(),2,'filtered total and matching record agree');
    assert.equal(await page.getByText('AUD 86.10',{ exact: true }).count(),0);
    await page.getByRole('tab',{ name: en ? 'All' : '全部',exact: true }).click();
    const moneyKey = `arctic-aria.money-browser-cache.v1.${owner}`, suppliesKey = `arctic-aria.supplies-browser-cache.v2.${owner}`;
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? '{}').views?.some((view) => view.data.expenses.length === 10),moneyKey);
    let releaseMoney; moneyGate = new Promise((resolve) => { releaseMoney = resolve; });
    await page.reload(); await button(newExpense).waitFor(); assert.equal(await button(newExpense).isEnabled(),true); releaseMoney();
    await page.getByRole('button',{ name: en ? 'Dismiss notification' : '关闭通知',exact: true }).first().waitFor();
    await dismissNotifications(page,en);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'Money fits viewport');
    await page.screenshot({ path: `${output}/money-${width}-${language}-${theme}.png`,fullPage: true });
    await page.goto(`${baseUrl}/supplies`);
    const slider = page.getByRole('slider',{ name: `${en ? 'Remaining' : '剩余量'}: Food fixture 1`,exact: true });
    await slider.waitFor();
    const newSupply = en ? 'New supply' : '新建物资';
    assert.equal(await button(newSupply).evaluate((button) => getComputedStyle(button.parentElement).gridTemplateColumns.split(' ').length),width >= 1024 ? 3 : width >= 640 ? 2 : 1);
    assert.equal(await button(newSupply).evaluate((button) => button.parentElement.firstElementChild === button),true,'creation is first grid cell');
    const createHeight = (await button(newSupply).boundingBox()).height;
    assert.ok(Math.abs(createHeight - (await page.locator('article').first().boundingBox()).height) <= 3,'creation tile matches compact stock card height');
    assert.equal(await page.getByRole('radio').count(),0,'no filtering toolbar');
    assert.equal(await page.getByRole('slider',{ name: `${en ? 'Remaining' : '剩余量'}: Food fixture 2`,exact: true }).count(),0,'legacy fractional quantity stays read-only');
    const first = () => items.find((item) => item.title === 'Food fixture 1');
    let releaseStock; stockGate = new Promise((resolve) => { releaseStock = resolve; }); failStock = 2;
    await slider.focus(); await page.keyboard.press('Home');
    await page.waitForFunction((label) => document.querySelector(`input[aria-label="${label}"]`).value === '0',`${en ? 'Remaining' : '剩余量'}: Food fixture 1`);
    assert.equal(await slider.isEnabled(),true,'saving stock remains interactive');
    assert.equal(await slider.inputValue(),'0','optimistic value appears while write is held');
    assert.equal(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).data.items.find((item) => item.title === 'Food fixture 1').quantity,suppliesKey),5,'pending changes never enter cache');
    assert.equal(await page.getByRole('slider',{ name: `${en ? 'Remaining' : '剩余量'}: Food fixture 3`,exact: true }).isEnabled(),true,'unrelated items stay interactive');
    releaseStock();
    await page.waitForFunction((label) => { const input = document.querySelector(`input[aria-label="${label}"]`); return !input.disabled && input.value === '5'; },`${en ? 'Remaining' : '剩余量'}: Food fixture 1`);
    assert.equal(first().quantity,5,'failure restores confirmed value');
    await dismissNotifications(page,en);
    const rapidWrites = stockWrites;
    stockGate = new Promise((resolve) => { releaseStock = resolve; });
    await slider.focus(); await page.keyboard.press('Home');
    await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('End'); await page.keyboard.press('ArrowLeft');
    assert.equal(await slider.inputValue(),'4','latest local intent wins while first write is pending');
    assert.equal(await slider.isEnabled(),true);
    releaseStock();
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).data.items.find((item) => item.title === 'Food fixture 1').quantity === 4,suppliesKey);
    assert.equal(stockWrites,rapidWrites + 2,'rapid intermediate levels coalesce into one final write');
    assert.equal(first().quantity,4);
    await slider.focus(); await page.keyboard.press('Home');
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).data.items.find((item) => item.title === 'Food fixture 1').quantity === 0,suppliesKey);
    assert.equal(await slider.inputValue(),'0');
    assert.ok(await slider.evaluate((input) => input.parentElement.firstElementChild.firstElementChild.getBoundingClientRect().width > 0),'empty level retains visible red fill');
    assert.ok(await slider.evaluate((input) => {
      const fill = input.parentElement.firstElementChild.firstElementChild;
      return fill.classList.contains('bg-red-500') && !['transparent','rgba(0, 0, 0, 0)'].includes(getComputedStyle(fill).backgroundColor);
    }),'empty level has a rendered red colour');
    const order = () => page.locator('article').evaluateAll((rows) => rows.map((row) => row.textContent));
    const beforeDrag = await order(), writes = stockWrites, bounds = await slider.boundingBox();
    await page.mouse.move(bounds.x + 2,bounds.y + bounds.height / 2); await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width - 2,bounds.y + bounds.height / 2,{ steps: 8 });
    assert.equal(stockWrites,writes,'drag previews must not persist intermediate levels');
    assert.equal(await slider.inputValue(),'5');
    const duringDrag = await order();
    assert.equal(duringDrag.findIndex((row) => row.includes('Food fixture 1')),beforeDrag.findIndex((row) => row.includes('Food fixture 1')),'ordering frozen during drag');
    await page.mouse.up();
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).data.items.find((item) => item.title === 'Food fixture 1').quantity === 5,suppliesKey);
    assert.equal(stockWrites,writes + 1,'one final drag write');
    assert.equal(await slider.evaluate((input) => getComputedStyle(input.parentElement).boxShadow.includes('2px')),false,'mouse drag has no focus outline');
    await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
    assert.equal(await slider.evaluate((input) => input.matches(':focus-visible') && getComputedStyle(input.parentElement).boxShadow.includes('2px')),true,'keyboard focus remains visible');
    const third = page.getByRole('slider',{ name: `${en ? 'Remaining' : '剩余量'}: Food fixture 3`,exact: true });
    await third.focus(); await page.keyboard.press('Home');
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).data.items.find((item) => item.title === 'Food fixture 3').quantity === 0,suppliesKey);
    const touchBounds = await third.boundingBox();
    if (width === 390) {
      const client = await context.newCDPSession(page), touchWrites = stockWrites;
      const point = (x) => [{ x,y: touchBounds.y + touchBounds.height / 2 }];
      await client.send('Input.dispatchTouchEvent',{ type: 'touchStart',touchPoints: point(touchBounds.x + 2) });
      await client.send('Input.dispatchTouchEvent',{ type: 'touchMove',touchPoints: point(touchBounds.x + touchBounds.width * 0.4) });
      await client.send('Input.dispatchTouchEvent',{ type: 'touchEnd',touchPoints: [] });
      await client.detach();
      await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).data.items.find((item) => item.title === 'Food fixture 3').quantity === 2,suppliesKey);
      assert.equal(stockWrites,touchWrites + 1,'touch drag commits once');
    } else {
      await third.click({ position: { x: touchBounds.width * 0.4,y: touchBounds.height / 2 } });
      await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key)).data.items.find((item) => item.title === 'Food fixture 3').quantity === 2,suppliesKey);
    }
    assert.equal(items.find((item) => item.title === 'Food fixture 2').quantity,0.5,'legacy quantity was not converted');
    assert.ok(await third.evaluate((input) => {
      const fill = input.parentElement.firstElementChild.firstElementChild;
      return fill.classList.contains('bg-amber-500') && !['transparent','rgba(0, 0, 0, 0)'].includes(getComputedStyle(fill).backgroundColor);
    }),'level two has a rendered amber colour');
    await button(newSupply).click(); await page.getByLabel(en ? 'Title' : '名称',{ exact: true }).fill('Added rice fixture');
    assert.equal(await page.getByRole('slider',{ name: en ? 'Initial stock' : '初始余量',exact: true }).inputValue(),'5');
    assert.equal(await page.getByLabel(en ? 'Unit' : '单位',{ exact: true }).count(),0);
    await page.screenshot({ path: `${output}/supply-config-${width}-${language}-${theme}.png`,fullPage: true });
    await button(en ? 'Create' : '创建').click(); await page.locator('.aa-dialog-overlay').waitFor({ state: 'detached' });
    await page.waitForFunction((key) => JSON.parse(localStorage.getItem(key) ?? '{}').data?.items.length === 17,suppliesKey);
    let releaseSupplies; suppliesGate = new Promise((resolve) => { releaseSupplies = resolve; });
    await page.reload(); await button('Added rice fixture').waitFor(); assert.equal(await button(newSupply).isEnabled(),true); releaseSupplies();
    await page.getByRole('button',{ name: en ? 'Dismiss notification' : '关闭通知',exact: true }).first().waitFor();
    await dismissNotifications(page,en);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),'Supplies fits viewport');
    await page.screenshot({ path: `${output}/supplies-${width}-${language}-${theme}.png`,fullPage: true });
    await button('Added rice fixture').click();
    const menuTrigger = button(en ? 'More actions' : '更多操作');
    const closeEditor = lastDialog().getByRole('button',{ name: en ? 'Close' : '关闭',exact: true });
    assert.deepEqual(await menuTrigger.evaluate((node) => [node.offsetWidth,node.offsetHeight]),await closeEditor.evaluate((node) => [node.offsetWidth,node.offsetHeight]),'menu trigger matches Close dimensions');
    assert.equal(await lastDialog().getByRole('button',{ name: en ? 'Archive' : '归档',exact: true }).count(),0,'no destructive footer button');
    await page.getByLabel(en ? 'Title' : '名称',{ exact: true }).fill('Unsaved title fixture');
    await menuTrigger.click();
    const menu = page.getByRole('menu'), deletion = menu.getByRole('menuitem',{ name: en ? 'Delete' : '删除',exact: true });
    await deletion.waitFor();
    assert.equal(await deletion.evaluate((node) => node === document.activeElement),true,'first enabled menu item receives focus');
    assert.equal(await menu.evaluate((node) => getComputedStyle(node).padding),'4px');
    assert.equal(await deletion.evaluate((node) => getComputedStyle(node).padding),'8px 12px');
    assert.equal(await deletion.evaluate((node) => getComputedStyle(node).borderWidth),'0px');
    assert.ok(Math.abs((await menu.boundingBox()).x + (await menu.boundingBox()).width - ((await menuTrigger.boundingBox()).x + (await menuTrigger.boundingBox()).width)) < 2,'menu aligns beneath trigger right edge');
    assert.ok(await menu.evaluate((node) => node.getBoundingClientRect().left >= 0 && node.getBoundingClientRect().right <= innerWidth),'menu fits narrow viewport');
    await page.screenshot({ path: `${output}/supply-action-menu-${width}-${language}-${theme}.png`,fullPage: true });
    await page.keyboard.press('Escape'); await menu.waitFor({ state: 'detached' });
    assert.equal(await menuTrigger.evaluate((node) => node === document.activeElement),true,'Escape returns focus without closing editor');
    await page.keyboard.press('Enter'); await deletion.waitFor();
    await page.keyboard.press('Tab'); await menu.waitFor({ state: 'detached' });
    assert.equal(await closeEditor.evaluate((node) => node === document.activeElement),true,'Tab dismisses and advances to the next header control');
    await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Enter'); await deletion.waitFor();
    await page.keyboard.press('ArrowDown'); await page.keyboard.press('End');
    assert.equal(await deletion.evaluate((node) => node === document.activeElement),true);
    await page.keyboard.press('Enter'); await menu.waitFor({ state: 'detached' });
    await page.getByText(en ? 'Archive this item?' : '归档这件物资？',{ exact: true }).waitFor();
    await button(en ? 'Cancel' : '取消').click();
    assert.equal(await page.getByLabel(en ? 'Title' : '名称',{ exact: true }).inputValue(),'Unsaved title fixture','cancelled confirmation preserves draft');
    assert.equal(items.length,17,'opening and cancelling Delete does not mutate backend fixtures');
    await menuTrigger.click(); await deletion.click();
    await button(en ? 'Archive' : '归档').click();
    await page.waitForFunction(() => document.querySelectorAll('.aa-dialog-overlay').length === 0);
    assert.equal(items.length,16,'confirmed Delete uses the existing archive command');
    assert.equal(await button('Added rice fixture').count(),0);
    assert.equal(await page.locator('summary').filter({ hasText: en ? 'Travel shopping' : '旅行购物' }).count(),0,'travel UI is hidden');
    assert.equal(wishlist.length,8,'travel records remain untouched');
    assert.equal(await button(en ? 'Progress' : '进步').count(),0,'no Progress navigation entry');
    await page.goto(`${baseUrl}/progress`); await page.waitForURL('**/today');
    await page.goto(`${baseUrl}/projects`); await button('Project fixture').click();
    await button(en ? 'Edit' : '编辑').first().click();
    const projectMenuTrigger = button(en ? 'Project editor actions' : '项目编辑操作');
    await projectMenuTrigger.click();
    const projectItems = page.getByRole('menuitem');
    assert.equal(await projectItems.count(),2,'Projects retains Template and Delete');
    assert.equal(await projectItems.first().evaluate((node) => node === document.activeElement),true);
    await page.keyboard.press('ArrowUp');
    assert.equal(await projectItems.last().evaluate((node) => node === document.activeElement),true,'Up wraps to Delete');
    await page.keyboard.press('Home');
    assert.equal(await projectItems.first().evaluate((node) => node === document.activeElement),true);
    await page.keyboard.press('ArrowDown');
    assert.equal(await projectItems.last().evaluate((node) => node === document.activeElement),true);
    assert.equal(await projectItems.last().evaluate((node) => getComputedStyle(node).outlineStyle),'none','keyboard highlight has no button-like outline');
    assert.ok(await projectItems.last().evaluate((node) => !['transparent','rgba(0, 0, 0, 0)'].includes(getComputedStyle(node).backgroundColor)),'keyboard focus retains visible background highlight');
    await page.screenshot({ path: `${output}/project-action-menu-${width}-${language}-${theme}.png`,fullPage: true });
    await page.keyboard.press('Escape'); await page.getByRole('menu').waitFor({ state: 'detached' });
    assert.equal(await projectMenuTrigger.evaluate((node) => node === document.activeElement),true);
    await projectMenuTrigger.click();
    await button(en ? 'Close project template' : '关闭项目模板').click();
    await page.getByRole('menu').waitFor({ state: 'detached' });
    assert.equal(expenses.length,10); assert.deepEqual(failures,[]);
    await context.close();
    console.log(`Personal tools passed: ${width}px ${language} ${theme}`);
  }
  console.log('Personal tools matrix passed: expense capture, categories, currencies, optimistic stock sliders, rollback, drag commit, legacy preservation, confirmed-only caches, responsive layouts and dialog action menus.');
} finally { await browser.close(); }
