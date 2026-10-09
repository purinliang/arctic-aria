"use server";

import { getCurrentUser } from '@/features/auth/actions';
import { failure } from '@/server/feature-result';
import { createChatService } from './server/chat-service';
import type { ChatSearch } from './types';

const service = createChatService();
export async function getChatHistory(search: ChatSearch = {}) {
  const user = await getCurrentUser();
  return user ? service.history(user.id, search) : failure('chat_unauthorized', 'auth');
}
export async function sendChatMessage(id: string, text: string) {
  const user = await getCurrentUser();
  return user ? service.send(user.id, id, text) : failure('chat_unauthorized', 'auth');
}
