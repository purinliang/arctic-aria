import type { TaskInput } from "@/features/tasks/actions";
import type {
  Priority,
  Task,
  TaskStatus,
} from "@/features/dashboard/types";

export const statusOptions: Array<{ value: "all" | TaskStatus; label: string }> = [
  { value: "all", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "doing", label: "Doing" },
  { value: "blocked", label: "Blocked" },
  { value: "skipped", label: "Skipped" },
  { value: "done", label: "Done" },
];

export const priorityOptions: Array<{ value: Priority; label: string }> = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function emptyDraft(): TaskInput {
  return {
    title: "",
    description: "",
    planTitle: "",
    priority: "medium",
    status: "todo",
    weight: 1,
    completedWeight: 0,
    deadlineAt: "",
    scheduledDate: "",
    children: [],
  };
}

export function toDraft(task: Task): TaskInput {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    planTitle: task.planLabel === "No plan" ? "" : task.planLabel,
    priority: task.priority,
    status: task.status,
    weight: task.weight,
    completedWeight: task.completedWeight,
    deadlineAt: task.deadlineAt,
    scheduledDate: task.scheduledDate,
    children:
      task.subtasks?.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        description: subtask.description,
        weight: subtask.weight,
        completedWeight: subtask.completedWeight,
        status: subtask.status,
      })) ?? [],
  };
}

export function titleCase(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}

export function completedText(task: Pick<Task, "completedWeight" | "weight">) {
  return `${task.completedWeight} / ${task.weight} weight done`;
}
