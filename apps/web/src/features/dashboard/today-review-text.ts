import type { PinnedMemory, Routine, Task } from "./types.ts";

export type TodayReviewSummaryTone =
  | "fulfilled"
  | "near"
  | "steady"
  | "started"
  | "life"
  | "gentle"
  | "open";

export type TodayReviewSummaryMessages = Record<
  TodayReviewSummaryTone,
  readonly string[]
>;

type TodayReviewSummaryInput = {
  dateKey: string;
  doneTaskCount: number;
  openTaskCount: number;
  doneRoutineCount: number;
  openRoutineCount: number;
  experiencedMemoryCount: number;
  messages: TodayReviewSummaryMessages;
};

const taskProgressWeight = 3;
const routineProgressWeight = 1;

export function buildTodayReviewText({
  dateKey = todayReviewDateKey(),
  memories,
  routines,
  summaryMessages = fallbackTodayReviewSummaryMessages,
  tasks,
}: {
  dateKey?: string;
  memories: PinnedMemory[];
  routines: Routine[];
  summaryMessages?: TodayReviewSummaryMessages;
  tasks: Task[];
}) {
  const doneTasks = tasks.filter((task) => task.status === "done");
  const openTasks = tasks.filter((task) => task.status !== "done");
  const doneRoutines = routines.filter(
    (routine) => routine.status === "completed",
  );
  const openRoutines = routines.filter(
    (routine) => routine.status !== "completed",
  );
  const experiencedMemories = memories.filter(
    (memory) => memory.status === "completed",
  );
  const openMemories = memories.filter(
    (memory) => memory.status !== "completed",
  );
  const summaryText = buildTodayReviewSummary({
    dateKey,
    doneTaskCount: doneTasks.length,
    openTaskCount: openTasks.length,
    doneRoutineCount: doneRoutines.length,
    openRoutineCount: openRoutines.length,
    experiencedMemoryCount: experiencedMemories.length,
    messages: summaryMessages,
  });
  const lines = [
    "## Today Review",
    "",
    "### Tasks",
    completedBlock(
      "completed",
      doneTasks.map((task) => task.title),
      "task",
      "tasks",
    ),
    "",
    openBlock("Open tasks", openTasks.map((task) => task.title)),
    "",
    "### Routines",
    completedBlock(
      "completed",
      doneRoutines.map((routine) => routine.title),
      "routine",
      "routines",
    ),
    "",
    openBlock("Open routines", openRoutines.map((routine) => routine.title)),
    "",
    "### Pinned Memories",
    completedBlock(
      "experienced",
      experiencedMemories.map((memory) => memory.title),
      "pinned memory",
      "pinned memories",
    ),
    "",
    openBlock("Not yet", openMemories.map((memory) => memory.title)),
  ];

  if (summaryText) {
    lines.push("", "### Summary", summaryText);
  }

  return lines.join("\n");
}

export function todayReviewDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function buildTodayReviewSummary(input: TodayReviewSummaryInput) {
  const tone = selectTodayReviewSummaryTone(input);
  const options = input.messages[tone];

  if (options.length === 0) {
    return "";
  }

  return options[summaryOptionIndex(input, options.length)] ?? options[0] ?? "";
}

export function selectTodayReviewSummaryTone({
  doneTaskCount,
  doneRoutineCount,
  experiencedMemoryCount,
  openTaskCount,
  openRoutineCount,
}: Omit<
  TodayReviewSummaryInput,
  "dateKey" | "messages"
>): TodayReviewSummaryTone {
  const doneWeight =
    doneTaskCount * taskProgressWeight +
    doneRoutineCount * routineProgressWeight;
  const totalWeight =
    (doneTaskCount + openTaskCount) * taskProgressWeight +
    (doneRoutineCount + openRoutineCount) * routineProgressWeight;

  if (totalWeight === 0 && experiencedMemoryCount === 0) {
    return "open";
  }

  if (doneWeight === 0 && experiencedMemoryCount > 0) {
    return "life";
  }

  if (doneWeight === 0) {
    return "gentle";
  }

  const progress = doneWeight / totalWeight;

  if (progress >= 1) {
    return "fulfilled";
  }

  if (progress >= 0.8) {
    return "near";
  }

  if (progress >= 0.5) {
    return "steady";
  }

  if (progress >= 0.2) {
    return "started";
  }

  return "started";
}

function summaryOptionIndex(input: TodayReviewSummaryInput, optionCount: number) {
  let hash = 0;
  const statusKey = [
    input.dateKey,
    input.doneTaskCount,
    input.openTaskCount,
    input.doneRoutineCount,
    input.openRoutineCount,
    input.experiencedMemoryCount,
  ].join(":");

  for (const character of statusKey) {
    hash = (hash * 31 + character.charCodeAt(0)) % optionCount;
  }

  return hash;
}

function completedBlock(
  verb: string,
  items: string[],
  singularLabel: string,
  pluralLabel: string,
) {
  if (items.length === 0) {
    return `You ${verb} no ${pluralLabel} today.`;
  }

  return [
    `You ${verb} ${items.length} ${
      items.length === 1 ? singularLabel : pluralLabel
    } today:`,
    itemList(items),
  ].join("\n");
}

function openBlock(title: string, items: string[]) {
  return [`${title}:`, items.length > 0 ? itemList(items) : "None."].join("\n");
}

function itemList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

const fallbackTodayReviewSummaryMessages: TodayReviewSummaryMessages = {
  fulfilled: ["The visible work is complete for today."],
  near: ["Only a little remains; leave enough room to breathe."],
  steady: ["Real progress is already visible."],
  started: ["One finished thing still matters."],
  life: ["Life counted today too."],
  gentle: ["Give tomorrow a little more room."],
  open: ["A quiet slate can still be useful."],
};
