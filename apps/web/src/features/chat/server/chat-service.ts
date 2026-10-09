import { createGeminiClient, GeminiError } from '../../../server/ai/gemini-client.ts';
import { createCredentialEncryption } from '../../../server/ai/credential-encryption.ts';
import { failure, validId } from '../../../server/feature-result.ts';
import type { FeatureResult } from '../../../server/feature-result.ts';
import { AIProviderRepository } from '../../settings/server/ai-provider-repository.ts';
import { validGeminiModel } from '../../settings/ai-provider.ts';
import { ChatRepository } from './chat-repository.ts';
import type { ChatExchange, ChatHistory, ChatSearch } from '../types.ts';

export function createChatService({ repository = new ChatRepository(), settings = new AIProviderRepository(),
  encryption = createCredentialEncryption(), client = createGeminiClient }: {
    repository?: Pick<ChatRepository, 'expire' | 'list' | 'find' | 'claim' | 'context' | 'finish'>;
    settings?: Pick<AIProviderRepository, 'find'>;
    encryption?: Pick<ReturnType<typeof createCredentialEncryption>, 'decrypt'>;
    client?: (options: { env: Record<string, string> }) => Pick<ReturnType<typeof createGeminiClient>, 'generateConversation'>;
  } = {}) {
  async function guarded<T>(userId: string, run: () => Promise<FeatureResult<T>>): Promise<FeatureResult<T>> {
    if (!validId(userId)) return failure('chat_unauthorized', 'auth');
    try { return await run(); }
    catch (error) {
      // Never log chat text, ciphertext, credentials or provider response bodies.
      if (error instanceof GeminiError) {
        const code = error.code === 'timeout' || error.status === 408 || error.status === 504 ? 'chat_timeout'
          : error.code === 'network_failure' ? 'chat_network'
            : error.status === 429 ? 'chat_rate_limited'
              : error.status === 400 || error.status === 401 || error.status === 403 ? 'chat_invalid_key'
                : error.status === 404 || (error.status && error.status >= 500) ? 'chat_provider_unavailable' : 'chat_internal';
        return failure(code, 'domain');
      }
      if (error && typeof error === 'object' && 'code' in error && error.code === '23505') return failure('chat_busy', 'domain');
      return failure('chat_internal', 'database_update');
    }
  }
  return {
    history(userId: string, search: ChatSearch = {}): Promise<FeatureResult<ChatHistory>> {
      if (!search || (search.query !== undefined && (typeof search.query !== 'string' || search.query.length > 200))
        || (search.before !== undefined && !validId(search.before))) return Promise.resolve(failure('chat_invalid'));
      return guarded(userId, async () => {
        await repository.expire(userId);
        const [history, provider] = await Promise.all([repository.list(userId, search), settings.find(userId)]);
        return { ok: true, data: { ...history, enabled: !!(provider?.enabled && provider.encrypted_api_key) } };
      });
    },
    send(userId: string, id: string, text: string): Promise<FeatureResult<ChatExchange>> {
      if (!validId(id) || typeof text !== 'string' || !text.trim() || text.length > 4000) return Promise.resolve(failure('chat_invalid'));
      return guarded(userId, async () => {
        await repository.expire(userId);
        const existing = await repository.find(userId, id);
        if (existing && existing.userText !== text.trim()) return failure('chat_invalid');
        if (existing?.status === 'complete') return { ok: true, data: existing };
        if (existing?.status === 'pending') return failure('chat_busy', 'domain');
        const provider = await settings.find(userId);
        if (!provider?.enabled || !provider.encrypted_api_key) return failure('chat_not_configured', 'domain');
        if (!validGeminiModel(provider.model)) return failure('chat_provider_unavailable', 'domain');
        const key = encryption.decrypt(userId, provider.encrypted_api_key);
        const lease = await repository.claim(userId, id, text.trim(), provider.model);
        if (!lease) return failure('chat_busy', 'domain');
        try {
          const previous = await repository.context(userId, id);
          const turns = previous.flatMap(entry => [
            { role: 'user' as const, text: entry.userText }, { role: 'model' as const, text: entry.assistantText! },
          ]);
          const response = await client({ env: { GEMINI_API_KEY: key, GEMINI_MODEL: provider.model } })
            .generateConversation([...turns, { role: 'user', text: text.trim() }]);
          const completed = await repository.finish(userId, id, lease, response.text);
          return completed ? { ok: true, data: completed } : failure('chat_internal', 'database_update');
        } catch (error) {
          await repository.finish(userId, id, lease, null);
          throw error;
        }
      });
    },
  };
}
