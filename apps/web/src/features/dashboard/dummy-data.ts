import type { RewardPreview, Routine, Task } from "./types";

export const dayBoundary = "04:00";

export const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Finalize chapter outline",
    planLabel: "Writing sprint",
    deadline: "10:30",
    priority: "High",
    status: "partial",
    weight: 5,
    completedWeight: 2,
    subtasks: [
      { id: "task-1-a", title: "Clean act break notes", done: true },
      { id: "task-1-b", title: "Mark missing source checks", done: false },
      { id: "task-1-c", title: "Send draft to review queue", done: false },
    ],
  },
  {
    id: "task-2",
    title: "Ship invoice reconciliation",
    planLabel: "Finance admin",
    deadline: "13:00",
    priority: "High",
    status: "todo",
    weight: 4,
    completedWeight: 0,
    subtasks: [
      { id: "task-2-a", title: "Confirm four vendor totals", done: false },
      { id: "task-2-b", title: "Attach receipts", done: false },
    ],
  },
  {
    id: "task-3",
    title: "Prototype reward copy",
    planLabel: "Product polish",
    deadline: "16:45",
    priority: "Medium",
    status: "todo",
    weight: 3,
    completedWeight: 0,
  },
  {
    id: "task-4",
    title: "Weekly planning cleanup",
    planLabel: "Planning",
    deadline: "21:15",
    priority: "Low",
    status: "done",
    weight: 2,
    completedWeight: 2,
    subtasks: [
      { id: "task-4-a", title: "Archive stale cards", done: true },
      { id: "task-4-b", title: "Pin next three priorities", done: true },
    ],
  },
];

export const initialRoutines: Routine[] = [
  {
    id: "routine-1",
    title: "Morning medication",
    scheduledTime: "08:00",
    reminderState: "sent",
    status: "done",
    streakText: "18 day streak",
  },
  {
    id: "routine-2",
    title: "Lunch walk",
    scheduledTime: "12:20",
    reminderState: "armed",
    status: "pending",
    streakText: "4 day streak",
  },
  {
    id: "routine-3",
    title: "Inbox zero pass",
    scheduledTime: "15:30",
    reminderState: "armed",
    status: "pending",
    streakText: "Due today",
  },
  {
    id: "routine-4",
    title: "Evening shutdown",
    scheduledTime: "22:45",
    reminderState: "muted",
    status: "busy",
    streakText: "Flexible window",
  },
];

export const rewardPreview: RewardPreview = {
  baseGold: 40,
  perWeightGold: 12,
  routineGold: 18,
  itemName: "Frosted Supply Cache",
};
