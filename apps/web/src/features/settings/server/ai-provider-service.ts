import { createCredentialEncryption, CredentialEncryptionError } from "../../../server/ai/credential-encryption.ts";
import { createGeminiClient, GeminiError } from "../../../server/ai/gemini-client.ts";
import { geminiConnectionTestPrompt } from "../../../server/ai/gemini-config.ts";
import { failure, validId } from "../../../server/feature-result.ts";
import type { FeatureResult } from "../../../server/feature-result.ts";
import { defaultAIModel, defaultAIProviderStatus, validAPIKey, validGeminiModel } from "../ai-provider.ts";
import type { AIProviderInput, AIProviderStatus, GeminiModel } from "../ai-provider.ts";
import { AIKeyAlreadySavedError, AIProviderRepository } from "./ai-provider-repository.ts";

type Repository = Pick<AIProviderRepository, "find" | "save" | "claimTest">;

class AISettingsError extends Error {
  readonly code: string;
  constructor(code: string) { super(code); this.code = code; }
}

export function createAIProviderService({
  repository = new AIProviderRepository(),
  encryption = createCredentialEncryption(),
  client = (apiKey: string, model: GeminiModel) => createGeminiClient({
    env: { GEMINI_API_KEY: apiKey, GEMINI_MODEL: model }, logConnectionTestErrors: true,
  }),
}: {
  repository?: Repository;
  encryption?: ReturnType<typeof createCredentialEncryption>;
  client?: (apiKey: string, model: GeminiModel) => Pick<ReturnType<typeof createGeminiClient>, "generateText">;
} = {}) {
  async function command<T>(userId: string, work: () => Promise<T>): Promise<FeatureResult<T>> {
    if (!validId(userId)) return failure("settings_unauthorized", "auth");
    try { return { ok: true, data: await work() }; }
    catch (error) {
      if (error instanceof AISettingsError) return failure(error.code, "domain");
      if (error instanceof AIKeyAlreadySavedError) return failure("ai_key_exists", "domain");
      if (error instanceof CredentialEncryptionError) return failure("ai_encryption_unavailable", "domain");
      if (error instanceof GeminiError) {
        return failure(error.status === 429 ? "ai_quota" : error.status === 400 || error.status === 401 || error.status === 403
          ? "ai_key_rejected" : error.status === 404 ? "ai_model_unavailable" : "ai_test_failed", "domain");
      }
      // Do not log credential-bearing database/provider exceptions.
      return failure("ai_unavailable", "database_update");
    }
  }

  return {
    get(userId: string) {
      return command(userId, async () => {
        const row = await repository.find(userId);
        return row ? { enabled: row.enabled, provider: "google_gemini" as const, hasKey: Boolean(row.encrypted_api_key), model: row.model }
          : { ...defaultAIProviderStatus };
      });
    },
    async save(userId: string, input: AIProviderInput): Promise<FeatureResult<AIProviderStatus>> {
      if (!input || typeof input.enabled !== "boolean" || input.provider !== "google_gemini"
        || (input.apiKey !== undefined && typeof input.apiKey !== "string")
        || (input.removeKey !== undefined && typeof input.removeKey !== "boolean")) return failure("ai_invalid");
      if (input.model !== undefined && !validGeminiModel(input.model)) return failure("ai_model_invalid");
      const key = input.apiKey?.trim() ?? "";
      if ((key && !validAPIKey(key)) || (input.removeKey && (input.enabled || key))) return failure("ai_invalid");
      if (!validId(userId)) return failure("settings_unauthorized", "auth");
      return command(userId, async () => {
        const existing = key || input.enabled ? await repository.find(userId) : null;
        if (key && existing?.encrypted_api_key) throw new AISettingsError("ai_key_exists");
        if (input.enabled && !key && !existing?.encrypted_api_key) {
          throw new AISettingsError("ai_key_required");
        }
        if (key) {
          if (!(await repository.claimTest(userId))) throw new AISettingsError("ai_test_throttled");
          await client(key, input.model ?? existing?.model ?? defaultAIModel).generateText(geminiConnectionTestPrompt);
        }
        return repository.save(userId, input.enabled, key ? encryption.encrypt(userId, key) : null, input.removeKey === true, input.model);
      });
    },
    async test(userId: string, draftKey: string, model: GeminiModel = defaultAIModel): Promise<FeatureResult<{ tested: true }>> {
      if (!validGeminiModel(model)) return failure("ai_model_invalid", "domain");
      if (typeof draftKey !== "string") return failure("ai_key_required", "domain");
      const key = draftKey.trim();
      if (!key) return failure("ai_key_required", "domain");
      if (!validAPIKey(key)) return failure("ai_invalid");
      return command(userId, async () => {
        if (!(await repository.claimTest(userId))) throw new AISettingsError("ai_test_throttled");
        await client(key, model).generateText(geminiConnectionTestPrompt);
        return { tested: true as const };
      });
    },
  };
}

export const aiProviderService = createAIProviderService();
