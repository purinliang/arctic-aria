'use server';

import { getCurrentUser } from '@/features/auth/actions';
import { loadUserResolvedTimeZone } from '@/features/settings/server/user-time-zone';
import { lifeService } from './server/life-service';
import type { LifeChatInput, LifeInput } from './types';
import { lifeChatService } from './server/life-chat-service';

const unauthorized = () => ({ ok: false as const, code: 'auth_required', category: 'auth' as const, message: 'Please sign in again.' });

export async function getLifeEntries() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();
  return lifeService.list(user.id, await loadUserResolvedTimeZone(user.id));
}

export async function saveLifeEntry(input: LifeInput) {
  const user = await getCurrentUser();
  return user ? lifeService.save(user.id, input) : unauthorized();
}

export async function archiveLifeEntry(id: string) {
  const user = await getCurrentUser();
  return user ? lifeService.archive(user.id, id) : unauthorized();
}

export async function getLifeChatHistory() {
  const user = await getCurrentUser();
  return user ? lifeChatService.list(user.id) : unauthorized();
}

export async function sendLifeChatMessage(input: LifeChatInput) {
  const user = await getCurrentUser();
  return user ? lifeChatService.send(user.id, input) : unauthorized();
}
