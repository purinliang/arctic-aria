import { formatDateKey } from "../../components/forms/date-format.ts";
import { englishFormMessages } from "../../messages/form-messages.ts";
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
  const summaryText = buildTodayReviewSummary({
    dateKey,
    doneTaskCount: doneTasks.length,
    openTaskCount: openTasks.length,
    doneRoutineCount: doneRoutines.length,
    openRoutineCount: openRoutines.length,
    experiencedMemoryCount: experiencedMemories.length,
    messages: summaryMessages,
  });
  const summaryParagraph = [
    summaryText,
    reviewCountSentence({
      doneMemoryCount: experiencedMemories.length,
      doneRoutineCount: doneRoutines.length,
      doneTaskCount: doneTasks.length,
    }),
  ]
    .filter(Boolean)
    .join(" ");
  const dateLabel = formatDateKey(
    dateKey,
    englishFormMessages.datePicker,
    dateKey,
  );
  const lines = [
    `### Daily Review for ${dateLabel}`,
    "",
    summaryParagraph,
    "",
    "### Tasks",
    checkboxList(
      tasks.map((task) => ({
        done: task.status === "done",
        title: task.title,
        description: task.description,
      })),
      "No tasks were selected today.",
    ),
    "### Routines",
    checkboxList(
      routines.map((routine) => ({
        done: routine.status === "completed",
        title: routine.title,
        description: routine.description,
      })),
      "No routines were due today.",
    ),
    "### Pinned Memories",
    checkboxList(
      memories.map((memory) => ({
        done: memory.status === "completed",
        title: memory.title,
        description: memory.description,
      })),
      "No pinned memories yet.",
    ),
  ];

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
  const progress = todayReviewCompletionProgress({
    doneRoutineCount,
    doneTaskCount,
    openRoutineCount,
    openTaskCount,
  });
  const doneWeight =
    doneTaskCount * taskProgressWeight +
    doneRoutineCount * routineProgressWeight;

  if (progress.totalWeight === 0 && experiencedMemoryCount === 0) {
    return "open";
  }

  if (doneWeight === 0 && experiencedMemoryCount > 0) {
    return "life";
  }

  if (doneWeight === 0) {
    return "gentle";
  }

  if (progress.value >= 1) {
    return "fulfilled";
  }

  if (progress.value >= 0.8) {
    return "near";
  }

  if (progress.value >= 0.5) {
    return "steady";
  }

  if (progress.value >= 0.2) {
    return "started";
  }

  return "started";
}

export function todayReviewCompletionProgress({
  doneTaskCount,
  doneRoutineCount,
  openTaskCount,
  openRoutineCount,
}: {
  doneTaskCount: number;
  doneRoutineCount: number;
  openTaskCount: number;
  openRoutineCount: number;
}) {
  const doneWeight =
    doneTaskCount * taskProgressWeight +
    doneRoutineCount * routineProgressWeight;
  const totalWeight =
    (doneTaskCount + openTaskCount) * taskProgressWeight +
    (doneRoutineCount + openRoutineCount) * routineProgressWeight;

  return {
    totalWeight,
    value: totalWeight > 0 ? doneWeight / totalWeight : 0,
  };
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

const fallbackTodayReviewSummaryMessages: TodayReviewSummaryMessages = {
  fulfilled: ["The visible work is complete for today."],
  near: ["Only a little remains; leave enough room to breathe."],
  steady: ["Real progress is already visible."],
  started: ["One finished thing still matters."],
  life: ["Life counted today too."],
  gentle: ["Give tomorrow a little more room."],
  open: ["A quiet slate can still be useful."],
};

function reviewCountSentence({
  doneMemoryCount,
  doneRoutineCount,
  doneTaskCount,
}: {
  doneMemoryCount: number;
  doneRoutineCount: number;
  doneTaskCount: number;
}) {
  const workSentence = workCountSentence(doneTaskCount, doneRoutineCount);
  const memorySentence =
    doneMemoryCount === 0
      ? "No pinned memories were experienced today."
      : `You also experienced ${countText(
          doneMemoryCount,
          "pinned memory",
          "pinned memories",
        )}.`;

  return `${workSentence} ${memorySentence}`;
}

function workCountSentence(doneTaskCount: number, doneRoutineCount: number) {
  if (doneTaskCount === 0 && doneRoutineCount === 0) {
    return "No tasks or routines were finished today.";
  }

  if (doneTaskCount > 0 && doneRoutineCount > 0) {
    return `You finished ${countText(
      doneTaskCount,
      "task",
      "tasks",
    )} and ${countText(doneRoutineCount, "routine", "routines")} today.`;
  }

  if (doneTaskCount > 0) {
    return `You finished ${countText(
      doneTaskCount,
      "task",
      "tasks",
    )} today. No routines were finished.`;
  }

  return `You finished ${countText(
    doneRoutineCount,
    "routine",
    "routines",
  )} today. No tasks were finished.`;
}

function countText(count: number, singularLabel: string, pluralLabel: string) {
  return `${count} ${count === 1 ? singularLabel : pluralLabel}`;
}

function checkboxList(
  items: Array<{
    done: boolean;
    title: string;
    description: string | null;
  }>,
  emptyText: string,
) {
  if (items.length === 0) {
    return emptyText;
  }

  return items
    .map((item) => {
      const checkbox = item.done ? "`[x]`" : "`[ ]`";
      const title = markdownText(item.title);
      const description = item.description?.trim().replace(/\s+/g, " ");

      if (!description) {
        return `- ${checkbox} **${title}**`;
      }

      return `- ${checkbox} **${title}**: ${markdownText(description)}`;
    })
    .join("\n");
}

function markdownText(value: string) {
  return value.replace(/([\\*_`~])/g, "\\$1");
}
