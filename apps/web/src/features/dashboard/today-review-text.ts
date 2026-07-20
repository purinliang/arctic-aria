import type { PinnedMemory, Routine, Task } from "./types.ts";

export function buildTodayReviewText({
  memories,
  routines,
  tasks,
}: {
  memories: PinnedMemory[];
  routines: Routine[];
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

  return [
    "Today Review",
    "",
    section("Done tasks", doneTasks.map((task) => task.title)),
    section("Open tasks", openTasks.map((task) => task.title)),
    section("Done routines", doneRoutines.map((routine) => routine.title)),
    section("Open routines", openRoutines.map((routine) => routine.title)),
    section("Pinned memories", memories.map((memory) => memory.title)),
  ].join("\n");
}

function section(title: string, items: string[]) {
  return items.length > 0
    ? `${title}: ${items.join(", ")}.`
    : `${title}: none.`;
}
