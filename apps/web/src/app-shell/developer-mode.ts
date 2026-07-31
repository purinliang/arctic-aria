export const developerModeStorageKey = "arctic-aria.developer-mode";

type BrowserStorage = Pick<Storage, "getItem" | "setItem">;

export function readDeveloperModeStorage(
  storage: Pick<Storage, "getItem"> | null | undefined,
) {
  try {
    return storage?.getItem(developerModeStorageKey) === "true";
  } catch {
    return false;
  }
}

export function writeDeveloperModeStorage(
  storage: BrowserStorage | null | undefined,
  enabled: boolean,
) {
  try {
    storage?.setItem(developerModeStorageKey, enabled ? "true" : "false");
  } catch {
    // Developer mode still works for the current session if storage is blocked.
  }
}

export function readStoredDeveloperModeEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return readDeveloperModeStorage(window.localStorage);
}

export function writeStoredDeveloperModeEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  writeDeveloperModeStorage(window.localStorage, enabled);
}
