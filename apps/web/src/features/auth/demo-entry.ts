export const demoLoadingDelayMs = 2_000;

export function isDemoEntrySearch(search: string) {
  return new URLSearchParams(search).get("demo") === "true";
}
