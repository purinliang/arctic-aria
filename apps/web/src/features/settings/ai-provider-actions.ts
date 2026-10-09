"use server";

import { getCurrentUser } from "@/features/auth/actions";
import { failure } from "@/server/feature-result";
import type { AIProviderInput } from "./ai-provider";
import { aiProviderService } from "./server/ai-provider-service";

export async function getAIProviderSettings() {
  const user = await getCurrentUser();
  return user ? aiProviderService.get(user.id) : failure("settings_unauthorized", "auth");
}

export async function saveAIProviderSettings(input: AIProviderInput) {
  const user = await getCurrentUser();
  return user ? aiProviderService.save(user.id, input) : failure("settings_unauthorized", "auth");
}

export async function testAIProvider(draftKey?: string) {
  const user = await getCurrentUser();
  return user ? aiProviderService.test(user.id, draftKey) : failure("settings_unauthorized", "auth");
}
