import type { PinnedMemory, Routine, Task } from "./types.ts";

export function buildTodayReviewText({
  dateKey = todayReviewDateKey(),
  memories,
  routines,
  summaryOptions = ["A steady day still counts."],
  tasks,
}: {
  dateKey?: string;
  memories: PinnedMemory[];
  routines: Routine[];
  summaryOptions?: readonly string[];
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
  const summaryText = reviewSummaryForDate(dateKey, summaryOptions);
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

export function reviewSummaryForDate(
  dateKey: string,
  options: readonly string[],
) {
  if (options.length === 0) {
    return "";
  }

  let hash = 0;

  for (const character of dateKey) {
    hash = (hash * 31 + character.charCodeAt(0)) % options.length;
  }

  return options[hash] ?? options[0] ?? "";
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
