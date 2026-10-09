import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';
import { chromium } from 'playwright';
import { createAuthSessionToken } from '../src/features/auth/server/session.ts';
import { AIProviderRepository } from '../src/features/settings/server/ai-provider-repository.ts';
import { createCredentialEncryption } from '../src/server/ai/credential-encryption.ts';

// Disposable development accounts and fake keys; never calls Google.
if (!process.argv.includes('--confirm-development')) throw new Error('Requires --confirm-development; never run against production.');
const baseUrl = process.env.BASE_URL ?? 'http://localhost:3000';
if (!['localhost','127.0.0.1'].includes(new URL(baseUrl).hostname)) throw new Error('Local server required.');
const sql = neon(process.env.NEON_POSTGRES_URL);
const repository = new AIProviderRepository(sql);
const crypto = createCredentialEncryption();
const owners = [];
const browser = await chromium.launch({ headless: true });
try {
  const manifest = JSON.parse(await readFile(new URL('../.next/server/server-reference-manifest.json',import.meta.url),'utf8'));
  const unauthenticated = await browser.newContext();
  for (const name of ['getAIProviderSettings','saveAIProviderSettings','testAIProvider']) {
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
    const context = await browser.newContext({ viewport: { width: 1280,height: 900 } });
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
    assert.equal(await page.getByRole('button',{ name: 'Remove API key',exact: true }).count(),0,'new account cannot see another account credential');
    const key = `test-live-account-${index}-api-key`;
    await input.fill(key);
    await page.getByRole('button',{ name: 'Save',exact: true }).click();
    await page.getByRole('button',{ name: 'Remove API key',exact: true }).waitFor();
    let row = await repository.find(id);
    assert.equal(row.enabled,true);
    assert.ok(!row.encrypted_api_key.includes(key));
    assert.equal(crypto.decrypt(id,row.encrypted_api_key),key);
    assert.equal(await input.inputValue(),'');
    await page.reload();
    await page.getByRole('button',{ name: 'Remove API key',exact: true }).waitFor();
    assert.ok((await provider.textContent()).includes('Google Gemini'));
    await selectProvider('Disabled');
    await page.waitForFunction(() => document.querySelector('button[aria-label="Provider"]')?.disabled === false);
    assert.equal(await input.count(),0);
    row = await repository.find(id);
    assert.equal(row.enabled,false); assert.equal(crypto.decrypt(id,row.encrypted_api_key),key);
    await selectProvider('Google Gemini');
    await page.waitForFunction(() => document.querySelector('input[aria-label="API key"]')?.disabled === false);
    assert.equal((await repository.find(id)).enabled,true,'blank replacement can re-enable an existing key');
    const claims = await Promise.all([repository.claimTest(id),repository.claimTest(id),repository.claimTest(id)]);
    assert.equal(claims.filter(Boolean).length,1,'concurrent claims accept only one test');
    await page.getByRole('button',{ name: 'Remove API key',exact: true }).click();
    await page.getByRole('button',{ name: 'Remove API key',exact: true }).waitFor({ state: 'detached' });
    assert.deepEqual(await repository.find(id),{ enabled: false,encrypted_api_key: null });
    assert.equal(await repository.claimTest(id),false,'removal preserves cooldown');
    assert.deepEqual(errors,[]);
    await context.close();
  }
  console.log('Live AI settings checks passed: authentication guards, account isolation, encrypted save, reload, disable/re-enable, removal and concurrent database cooldown. No Google requests.');
} finally {
  await browser.close();
  for (const id of owners) await sql.query('DELETE FROM users WHERE id = $1',[id]);
}
