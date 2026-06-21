export type TaskStatus = "todo" | "partial" | "done";

export type Priority = "High" | "Medium" | "Low";

export type Subtask = {
  id: string;
  title: string;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  planLabel: string;
  deadline: string;
  priority: Priority;
  status: TaskStatus;
  weight: number;
  completedWeight: number;
  subtasks?: Subtask[];
};

export type RoutineStatus = "pending" | "done" | "skipped" | "busy";

export type Routine = {
  id: string;
  title: string;
  scheduledTime: string;
  reminderState: "armed" | "sent" | "muted";
  status: RoutineStatus;
  streakText: string;
};

export type RewardPreview = {
  baseGold: number;
  perWeightGold: number;
  routineGold: number;
  itemName: string;
};
