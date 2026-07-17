export type CachedDiscordBinding = {
  discordUserId: string;
  discordUsername: string | null;
};

export type CachedDiscordBindingCode = {
  value: string;
  expiresAt: string;
};

export type DiscordBindingCacheSnapshot = {
  binding: CachedDiscordBinding | null;
  pendingBindingCode: CachedDiscordBindingCode | null;
};

const discordBindingCache = new Map<string, DiscordBindingCacheSnapshot>();

export function readDiscordBindingCache(userId: string) {
  const snapshot = discordBindingCache.get(userId);

  return snapshot ? cloneSnapshot(snapshot) : null;
}

export function writeDiscordBindingCache(
  userId: string,
  snapshot: DiscordBindingCacheSnapshot,
) {
  discordBindingCache.set(userId, cloneSnapshot(snapshot));
}

export function clearDiscordBindingCache(userId: string) {
  discordBindingCache.delete(userId);
}

function cloneSnapshot(
  snapshot: DiscordBindingCacheSnapshot,
): DiscordBindingCacheSnapshot {
  return {
    binding: snapshot.binding ? { ...snapshot.binding } : null,
    pendingBindingCode: snapshot.pendingBindingCode
      ? { ...snapshot.pendingBindingCode }
      : null,
  };
}
