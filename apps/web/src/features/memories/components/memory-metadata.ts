type MemoryDoneInfo = {
  doneCount: number;
  lastDoneDate: string;
  lastDoneText: string;
};

type MemoryDoneMessages = {
  doneTimes: (count: number) => string;
  lastDone: (date: string) => string;
  neverDone: string;
};

export function memoryDoneMetadataSegments(
  memory: MemoryDoneInfo,
  messages: MemoryDoneMessages,
  formatDate: (value: string, fallback: string) => string,
) {
  const lastDone = memory.lastDoneDate
    ? messages.lastDone(formatDate(memory.lastDoneDate, memory.lastDoneText))
    : messages.neverDone;

  if (memory.doneCount <= 0) {
    return [lastDone];
  }

  return [lastDone, messages.doneTimes(memory.doneCount)];
}
