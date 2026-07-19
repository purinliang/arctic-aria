export function displayDescription(
  description: string | null | undefined,
  title: string,
  defaults: readonly string[],
) {
  const savedDescription = description?.trim() ?? "";

  if (savedDescription) {
    return savedDescription;
  }

  return defaultDescriptionForTitle(title, defaults);
}

export function defaultDescriptionForTitle(
  title: string,
  defaults: readonly string[],
) {
  return defaultDescriptionForSeed(title, defaults);
}

export function defaultDescriptionForSeed(
  seed: string,
  defaults: readonly string[],
) {
  if (defaults.length === 0) {
    return "";
  }

  return defaults[stableTextHash(seed) % defaults.length] ?? "";
}

function stableTextHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}
