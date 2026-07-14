export type TaskStatus =
  | "todo"
  | "doing"
  | "blocked"
  | "skipped"
  | "done"
  | "archived";

export type DashboardView = "dashboard" | "projects" | "routines" | "memories";

export type Priority = "high" | "medium" | "low";

export type Subtask = {
  id: string;
  title: string;
  description: string;
  isDone: boolean;
  done: boolean;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  projectLabel: string;
  milestoneLabel: string;
  deadline: string;
  priority: Priority;
  status: TaskStatus;
  scheduledDate: string;
  startDate: string;
  deadlineDate: string;
  subtaskSummary: string;
  subtasks?: Subtask[];
};

export type RoutineStatus = "pending" | "completed" | "skipped";
export type RoutineReminderState = "idle" | "reminding";

export type Routine = {
  id: string;
  routineId: string;
  title: string;
  description: string;
  scheduledTime: string;
  status: RoutineStatus;
  reminderState: RoutineReminderState;
  streakText: string;
};

export type RoutineRuleType =
  | "daily"
  | "weekly"
  | "bi_weekly"
  | "monthly_by_date"
  | "day_interval";

export type RoutineDefinition = {
  id: string;
  title: string;
  description: string;
  status: "active" | "deleted";
  firstStartDate: string;
  endDate: string | null;
  ruleType: RoutineRuleType;
  intervalValue: number | null;
  weekdays: number[] | null;
  dayOfMonth: number | null;
  preferredTime: string | null;
  timezone: string;
};

export type MemoryCategory = string;

export type PinnedMemoryStatus = "active" | "completed";

export type PinnedMemory = {
  id: string;
  memoryId: string;
  category: MemoryCategory;
  title: string;
  description: string;
  meta: string;
  position: number;
  status: PinnedMemoryStatus;
};

export type MemoryRecord = {
  id: string;
  categoryId: string;
  category: MemoryCategory;
  title: string;
  description: string;
  lastDoneText: string;
  doneCount: number;
  pinned: boolean;
};

export type MemorySuggestion = {
  id: string;
  category: MemoryCategory;
  title: string;
  description: string;
  lastDoneText: string;
  doneCount: number;
};

export type MemoryCategoryOption = {
  id: string;
  name: string;
  baseWeight: number;
};

export type ChestItemRarity =
  | "Legendary"
  | "Epic"
  | "Rare"
  | "Uncommon"
  | "Common";

export type ChestPreviewItem = {
  id: string;
  name: string;
  rarity: ChestItemRarity;
};

export type RewardPreview = {
  baseGold: number;
  perWeightGold: number;
  routineGold: number;
  chestName: string;
  chestItems: ChestPreviewItem[];
};
