import { randomBytes } from 'node:crypto';
import { appendFile, chmod, readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

const path = new URL('../.env.local', import.meta.url);
const content = await readFile(path, 'utf8').catch(error => {
  if (error.code === 'ENOENT') return '';
  throw error;
});
const existing = parseEnv(content).AI_CREDENTIAL_ENCRYPTION_KEY;
if (existing?.trim()) {
  console.log('AI encryption key already configured; left unchanged.');
} else {
  await appendFile(path, `\nAI_CREDENTIAL_ENCRYPTION_KEY=${randomBytes(32).toString('base64')}\n`, { mode: 0o600 });
  await chmod(path, 0o600);
  console.log('Created local AI encryption key in ignored .env.local. Keep it stable; never commit it.');
}
