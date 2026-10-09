import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { chromium } from 'playwright';
import { createAuthSessionToken } from '../src/features/auth/server/session.ts';
import { AIProviderRepository } from '../src/features/settings/server/ai-provider-repository.ts';
import { AIKeyAlreadySavedError } from '../src/features/settings/server/ai-provider-repository.ts';
import { createAIProviderService } from '../src/features/settings/server/ai-provider-service.ts';
import { createCredentialEncryption } from '../src/server/ai/credential-encryption.ts';
import { GeminiError } from '../src/server/ai/gemini-client.ts';

// Disposable development accounts and fake keys; never calls Google.
if (!process.argv.includes('--confirm-development')) throw new Error('Requires --confirm-development; never run against production.');
const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
if (!['localhost','127.0.0.1'].includes(new URL(baseUrl).hostname)) throw new Error('Local server required.');
const sql = neon(process.env.NEON_POSTGRES_URL);
const repository = new AIProviderRepository(sql);
const crypto = createCredentialEncryption();
const service = createAIProviderService({ repository,encryption: crypto,client: (_key,model) => ({
  async generateText(prompt) {
    assert.equal(prompt,'Reply with the word READY.');
    return { text: 'READY',model };
  },
}) });
const owners = [];
const browser = await chromium.launch({ headless: true });
try {
  const manifest = JSON.parse(await readFile(new URL('../.next/server/server-reference-manifest.json',import.meta.url),'utf8'));
  const [saveAction] = Object.entries(manifest.node).find(([,entry]) => entry.exportedName === 'saveAIProviderSettings');
  const unauthenticated = await browser.newContext();
  for (const name of ['getAIProviderSettings','saveAIProviderSettings']) {
    const [actionId] = Object.entries(manifest.node).find(([,entry]) => entry.exportedName === name);
    const args = name === 'saveAIProviderSettings' ? [{ enabled: true,provider: 'google_gemini',apiKey: 'test-unauthorized-api-key' }] : [];
    const response = await unauthenticated.request.post(`${baseUrl}/settings`,{
      headers: { 'Next-Action': actionId,'Content-Type': 'text/plain;charset=UTF-8',Origin: baseUrl },
      data: JSON.stringify(args),
    });
    assert.ok((await response.text()).includes('settings_unauthorized'),`${name} rejects unauthenticated requests`);
  }
  await unauthenticated.close();
  for (let index = 0; index < 2; index++) {
    const id = randomUUID(), username = `test${randomUUID().replaceAll('-','').slice(0,12)}`;
    await sql.query('INSERT INTO users (id,username,password_hash,display_name) VALUES ($1,$2,$3,$4)',[id,username,'disabled-test-login','Test User']);
    owners.push(id);
    const rejected = createAIProviderService({ repository,encryption: crypto,client: () => ({
      async generateText() { throw new GeminiError('request_failed',403); },
    }) });
    assert.equal((await rejected.save(id,{ enabled: true,provider: 'google_gemini',apiKey: 'test-rejected-api-key' })).ok,false);
    const rejectedRow = await repository.find(id);
    assert.equal(rejectedRow.enabled,false); assert.equal(rejectedRow.encrypted_api_key,null);
    await sql.query('DELETE FROM user_ai_settings WHERE user_id = $1',[id]);
    if (index === 1) await sql.query("INSERT INTO user_ai_settings (user_id, model) VALUES ($1, 'gemini-3.5-flash-lite')",[id]);
    const context = await browser.newContext({ viewport: { width: 1280,height: 900 } });
    // New-key saves exercise the real service/database with a fake Google client.
    // Provider toggles, reloads and deletion still use actual authenticated actions.
    await context.route('**/*',async route => {
      const request = route.request();
      if (request.headers()['next-action'] !== saveAction) return route.continue();
      const [input] = JSON.parse(request.postData() ?? '[]',(_key,value) => value === '$undefined' ? undefined : value);
      if (!input.apiKey) return route.continue();
      assert.ok(input.apiKey.startsWith('test-live-account-'));
      const result = await service.save(id,input);
      await route.fulfill({ status: 200,contentType: 'text/x-component',body: `0:{"a":"$@1","f":[],"b":"fixture"}\n1:${JSON.stringify(result)}\n` });
    });
    await context.addInitScript(() => {
      localStorage.setItem('arctic-aria.language-preference','en');
      localStorage.setItem('arctic-aria.theme-preference','dark');
    });
    await context.addCookies([{ name: 'arctic_aria_session',value: createAuthSessionToken({ id,username,displayName: 'Test User',isAdmin: false },process.env.AUTH_SESSION_SECRET),url: baseUrl,httpOnly: true,sameSite: 'Lax' }]);
    const page = await context.newPage(); page.setDefaultTimeout(60_000);
    const errors = [];
    page.on('pageerror',error => errors.push(error.name));
    await page.goto(`${baseUrl}/settings`);
    const provider = page.getByRole('button',{ name: 'Provider',exact: true });
    async function selectProvider(label) {
      await provider.click(); await page.getByRole('option',{ name: label,exact: true }).click();
    }
    await page.waitForFunction(() => document.querySelector('button[aria-label="Provider"]')?.disabled === false);
    await selectProvider('Google Gemini');
    const input = page.getByLabel('API key',{ exact: true });
    await page.waitForFunction(() => {
      const input = document.querySelector('input[aria-label="API key"]');
      return input && !input.disabled;
    });
    assert.equal(await input.inputValue(),'');
    const model = page.getByRole('button',{ name: 'Model',exact: true });
    assert.ok((await model.textContent()).includes('Gemini 3.5 Flash-Lite'));
    assert.equal(await model.isDisabled(),true);
    const remove = page.getByRole('button',{ name: 'Delete API key',exact: true });
    assert.equal(await remove.count(),0,'new account cannot see another account credential');
    const key = `test-live-account-${index}-api-key`;
    await input.fill(key);
    await page.getByRole('button',{ name: 'Save',exact: true }).click();
    await remove.waitFor();
    let row = await repository.find(id);
    assert.equal(row.enabled,true);
    assert.ok(!row.encrypted_api_key.includes(key));
    assert.equal(crypto.decrypt(id,row.encrypted_api_key),key);
    assert.equal(await input.count(),0,'A saved key has no replacement field');
    await assert.rejects(repository.save(id,true,crypto.encrypt(id,'test-other-api-key'),false),AIKeyAlreadySavedError);
    const ciphertext = row.encrypted_api_key;
    await repository.save(id,true,null,false,'gemini-3.5-flash-lite');
    row = await repository.find(id);
    assert.equal(row.model,'gemini-3.5-flash-lite');
    assert.equal(row.encrypted_api_key,ciphertext,'Changing model does not replace the key');
    await page.reload();
    await remove.waitFor();
    assert.ok((await provider.textContent()).includes('Google Gemini'));
    assert.ok((await model.textContent()).includes('Gemini 3.5 Flash-Lite'));
    await selectProvider('Disabled');
    await page.waitForFunction(() => document.querySelector('button[aria-label="Provider"]')?.disabled === false);
    assert.equal(await input.count(),0);
    row = await repository.find(id);
    assert.equal(row.enabled,false); assert.equal(crypto.decrypt(id,row.encrypted_api_key),key);
    await selectProvider('Google Gemini');
    await page.waitForFunction(() => document.querySelector('button[aria-label="Delete API key"]')?.disabled === false);
    assert.equal((await repository.find(id)).enabled,true,'blank replacement can re-enable an existing key');
    const claims = await Promise.all([repository.claimTest(id),repository.claimTest(id),repository.claimTest(id)]);
    assert.ok(claims.filter(Boolean).length <= 1,'Shared cooldown allows at most one concurrent claim');
    await remove.click(); await remove.waitFor({ state: 'detached' });
    assert.deepEqual(await repository.find(id),{ enabled: false,encrypted_api_key: null,model: 'gemini-3.5-flash-lite' });
    await assert.rejects(sql.query("UPDATE user_ai_settings SET model = 'gemini-2.5-flash' WHERE user_id = $1",[id]),
      error => error.code === '23514','Database rejects unavailable models');
    assert.equal(await repository.claimTest(id),false,'removal preserves cooldown');
    assert.deepEqual(errors,[]);
    await context.close();
  }
  console.log('Live AI settings checks passed: validation with a fake Google client, encrypted save, atomic replacement rejection, real authenticated reload/toggle/delete and cooldown. No Google requests.');
} finally {
  await browser.close();
  for (const id of owners) await sql.query('DELETE FROM users WHERE id = $1',[id]);
}
