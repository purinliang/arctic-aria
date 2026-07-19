import type { BuiltInMemoryCategoryKey } from "@/features/dashboard/types";
import type { MemoryExperienceMessages } from "@/messages/memory-experience-messages.ts";

type MemoryExperienceInfo = {
  doneCount: number;
  lastDoneDate: string;
  lastDoneText: string;
  categoryBuiltInKey: BuiltInMemoryCategoryKey | null;
};

export function memoryExperienceMetadataSegments(
  memory: MemoryExperienceInfo,
  messages: MemoryExperienceMessages,
  formatDate: (value: string, fallback: string) => string,
) {
  const copy = memoryExperienceCopy(memory.categoryBuiltInKey, messages);
  const lastDone = memory.lastDoneDate
    ? formatTemplate(copy.lastDone, {
        date: formatDate(memory.lastDoneDate, memory.lastDoneText),
      })
    : copy.neverDone;

  if (memory.doneCount <= 0) {
    return [lastDone];
  }

  return [
    lastDone,
    formatTemplate(
      memory.doneCount === 1 ? copy.doneTimes.one : copy.doneTimes.other,
      { count: memory.doneCount.toString() },
    ),
  ];
}

export function memoryExperienceActionLabels(
  builtInKey: BuiltInMemoryCategoryKey | null,
  messages: MemoryExperienceMessages,
  title: string,
) {
  const copy = memoryExperienceCopy(builtInKey, messages);

  return {
    cancelDone: formatTemplate(copy.cancelDone, { title }),
    markDone: formatTemplate(copy.markDone, { title }),
  };
}

function memoryExperienceCopy(
  builtInKey: BuiltInMemoryCategoryKey | null,
  messages: MemoryExperienceMessages,
) {
  return builtInKey
    ? (messages[builtInKey] ?? messages.fallback)
    : messages.fallback;
}

function formatTemplate(
  template: string,
  values: Record<string, string>,
) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (
    values[key] ?? match
  ));
}
