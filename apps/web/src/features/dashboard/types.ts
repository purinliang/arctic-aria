export type TaskStatus = "todo" | "partial" | "done";

export type DashboardView = "dashboard" | "memories";

export type Priority = "High" | "Medium" | "Low";

export type Subtask = {
  id: string;
  title: string;
  description: string;
  weight: number;
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

export type RoutineStatus = "pending" | "reminding" | "done" | "skipped";

export type Routine = {
  id: string;
  title: string;
  scheduledTime: string;
  status: RoutineStatus;
  streakText: string;
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
