import { geminiConfig, GeminiConfigError } from '../src/server/ai/gemini-config.ts';
import { createGeminiClient, GeminiError } from '../src/server/ai/gemini-client.ts';

const smoke = process.argv.slice(2);
try {
  if (smoke.length && (smoke.length !== 1 || smoke[0] !== '--smoke')) throw new GeminiConfigError('Use --smoke or no arguments.');
  const { model } = geminiConfig();
  console.log(`Gemini configured: model=${model}; API key present (not displayed).`);
  if (smoke.length) {
    await createGeminiClient().generateText('Reply with the word READY.');
    console.log('Gemini smoke test passed: received a non-empty text response.');
  } else {
    console.log('Configuration only: no API request or quota usage. Run ai:smoke to check model access.');
  }
} catch (error) {
  if (error instanceof GeminiError) console.error(`Gemini check failed: ${error.code}${error.status ? ` (HTTP ${error.status})` : ''}. Check model access, key restrictions, and quota.`);
  else console.error(error instanceof GeminiConfigError ? error.message : 'Gemini check failed. Check the server configuration.');
  process.exitCode = 1;
}
