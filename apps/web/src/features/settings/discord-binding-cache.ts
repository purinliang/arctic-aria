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

type BrowserStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">;

type DiscordBindingCacheEnvelope = {
  schemaVersion: 1;
  userId: string;
  data: DiscordBindingCacheSnapshot;
};

const discordBindingCache = new Map<string, DiscordBindingCacheSnapshot>();
const cacheKeyPrefix = "arctic-aria.discord-binding-cache.v1";

export function discordBindingCacheKey(userId: string) {
  return `${cacheKeyPrefix}.${encodeURIComponent(userId)}`;
}

export function readDiscordBindingCache(
  userId: string,
  storage = browserStorage(),
) {
  const memorySnapshot = discordBindingCache.get(userId);

  if (memorySnapshot) {
    return normalizeSnapshot(memorySnapshot);
  }

  if (!storage) {
    return null;
  }

  const key = discordBindingCacheKey(userId);

  try {
    const rawValue = storage.getItem(key);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue);

    if (!isCacheEnvelope(parsed, userId)) {
      safeRemoveItem(storage, key);
      return null;
    }

    const snapshot = normalizeSnapshot(parsed.data);

    discordBindingCache.set(userId, cloneSnapshot(snapshot));
    return snapshot;
  } catch {
    safeRemoveItem(storage, key);
    return null;
  }
}

export function writeDiscordBindingCache(
  userId: string,
  snapshot: DiscordBindingCacheSnapshot,
  storage = browserStorage(),
) {
  const normalizedSnapshot = normalizeSnapshot(snapshot);

  discordBindingCache.set(userId, cloneSnapshot(normalizedSnapshot));

  if (!storage) {
    return;
  }

  try {
    storage.setItem(
      discordBindingCacheKey(userId),
      JSON.stringify({
        schemaVersion: 1,
        userId,
        data: normalizedSnapshot,
      } satisfies DiscordBindingCacheEnvelope),
    );
  } catch {
    // The settings page can still use the in-memory snapshot when storage fails.
  }
}

export function clearDiscordBindingCache(
  userId: string,
  storage = browserStorage(),
) {
  discordBindingCache.delete(userId);

  if (!storage) {
    return;
  }

  safeRemoveItem(storage, discordBindingCacheKey(userId));
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

function normalizeSnapshot(
  snapshot: DiscordBindingCacheSnapshot,
): DiscordBindingCacheSnapshot {
  const clonedSnapshot = cloneSnapshot(snapshot);
  const pendingBindingCode = clonedSnapshot.pendingBindingCode;

  if (!pendingBindingCode) {
    return clonedSnapshot;
  }

  const expiresAt = new Date(pendingBindingCode.expiresAt).getTime();

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return {
      ...clonedSnapshot,
      pendingBindingCode: null,
    };
  }

  return clonedSnapshot;
}

function browserStorage(): BrowserStorage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeRemoveItem(storage: BrowserStorage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    // Ignore blocked browser storage and keep rendering from live data.
  }
}

function isCacheEnvelope(
  value: unknown,
  userId: string,
): value is DiscordBindingCacheEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DiscordBindingCacheEnvelope>;

  return (
    candidate.schemaVersion === 1 &&
    candidate.userId === userId &&
    hasExpectedSnapshotShape(candidate.data)
  );
}

function hasExpectedSnapshotShape(
  value: unknown,
): value is DiscordBindingCacheSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DiscordBindingCacheSnapshot>;

  return (
    isCachedBinding(candidate.binding) &&
    isCachedBindingCode(candidate.pendingBindingCode)
  );
}

function isCachedBinding(value: unknown): value is CachedDiscordBinding | null {
  if (value === null) {
    return true;
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CachedDiscordBinding>;

  return (
    typeof candidate.discordUserId === "string" &&
    (candidate.discordUsername === null ||
      typeof candidate.discordUsername === "string")
  );
}

function isCachedBindingCode(
  value: unknown,
): value is CachedDiscordBindingCode | null {
  if (value === null) {
    return true;
  }

  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CachedDiscordBindingCode>;

  return (
    typeof candidate.value === "string" &&
    typeof candidate.expiresAt === "string"
  );
}
