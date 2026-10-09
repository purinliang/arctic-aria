import type { NoteUsage } from './types.ts';

export function noteKey(note: string) { return note.trim().toLowerCase(); }
export function noteSuggestions(categoryId: string,presets: readonly string[],usage: readonly NoteUsage[]) {
  const candidates = new Map<string,{ note: string; count: number; order: number }>();
  presets.forEach((note,order) => {
    const key = noteKey(note);
    if (key && !candidates.has(key)) candidates.set(key,{ note: note.trim(),count: 0,order });
  });
  for (const record of usage) {
    const key = noteKey(record.note);
    if (record.categoryId !== categoryId || !key) continue;
    const candidate = candidates.get(key) ?? { note: record.note.trim(),count: 0,order: presets.length };
    candidate.count += record.count;
    candidates.set(key,candidate);
  }
  return [...candidates.values()].sort((a,b) => b.count - a.count || a.order - b.order || a.note.localeCompare(b.note)).map((entry) => entry.note);
}
