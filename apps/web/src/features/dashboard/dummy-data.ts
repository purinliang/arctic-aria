import type { RewardPreview, Routine, Task } from "./types";

export const dayBoundary = "04:00";

export const initialTasks: Task[] = [
  {
    id: "task-1",
    title: "Finalize chapter outline",
    planLabel: "Writing sprint",
    deadline: "Jun 21, 2026 10:30",
    priority: "High",
    status: "partial",
    weight: 5,
    completedWeight: 2,
    subtasks: [
      {
        id: "task-1-a",
        title: "Clean act break notes",
        description: "Remove stale beats and keep only the usable structure.",
        weight: 2,
        done: true,
      },
      {
        id: "task-1-b",
        title: "Mark missing source checks",
        description: "Flag facts that need verification before final review.",
        weight: 2,
        done: false,
      },
      {
        id: "task-1-c",
        title: "Send draft to review queue",
        description: "Prepare the short handoff note and attach the outline.",
        weight: 1,
        done: false,
      },
    ],
  },
  {
    id: "task-2",
    title: "Ship invoice reconciliation",
    planLabel: "Finance admin",
    deadline: "Jun 22, 2026 13:00",
    priority: "High",
    status: "todo",
    weight: 4,
    completedWeight: 0,
    subtasks: [
      {
        id: "task-2-a",
        title: "Confirm four vendor totals",
        description: "Compare the sheet totals against invoice line items.",
        weight: 2,
        done: false,
      },
      {
        id: "task-2-b",
        title: "Attach receipts",
        description: "Add receipt PDFs before the reconciliation is sent.",
        weight: 2,
        done: false,
      },
    ],
  },
  {
    id: "task-3",
    title: "Prototype reward copy",
    planLabel: "Product polish",
    deadline: "Jun 24, 2026 16:45",
    priority: "Medium",
    status: "todo",
    weight: 3,
    completedWeight: 0,
    subtasks: [
      {
        id: "task-3-a",
        title: "Write gold summary",
        description: "Draft the short positive feedback line for gold.",
        weight: 1,
        done: false,
      },
      {
        id: "task-3-b",
        title: "Review chest preview text",
        description: "Check rarity wording for the treasure chest hover state.",
        weight: 2,
        done: false,
      },
    ],
  },
  {
    id: "task-4",
    title: "Weekly planning cleanup",
    planLabel: "Planning",
    deadline: "Jun 21, 2026 21:15",
    priority: "Low",
    status: "done",
    weight: 2,
    completedWeight: 2,
    subtasks: [
      {
        id: "task-4-a",
        title: "Archive stale cards",
        description: "Move old planning notes out of the daily board.",
        weight: 1,
        done: true,
      },
      {
        id: "task-4-b",
        title: "Pin next three priorities",
        description: "Keep the next visible work small and concrete.",
        weight: 1,
        done: true,
      },
    ],
  },
];

export const initialRoutines: Routine[] = [
  {
    id: "routine-1",
    title: "Morning medication",
    scheduledTime: "08:00",
    status: "done",
    streakText: "18 day streak",
  },
  {
    id: "routine-2",
    title: "Lunch walk",
    scheduledTime: "12:20",
    status: "reminding",
    streakText: "4 day streak",
  },
  {
    id: "routine-3",
    title: "Inbox zero pass",
    scheduledTime: "15:30",
    status: "pending",
    streakText: "Due today",
  },
  {
    id: "routine-4",
    title: "Evening shutdown",
    scheduledTime: "22:45",
    status: "pending",
    streakText: "Flexible window",
  },
];

export const rewardPreview: RewardPreview = {
  baseGold: 40,
  perWeightGold: 12,
  routineGold: 18,
  chestName: "Treasure Chest Lv 2",
  chestItems: [
    { id: "chest-1", name: "Aurora Gem", rarity: "Legendary" },
    { id: "chest-2", name: "Polar Bloom", rarity: "Legendary" },
    { id: "chest-3", name: "Frost Thread", rarity: "Epic" },
    { id: "chest-4", name: "Blue Quartz", rarity: "Rare" },
    { id: "chest-5", name: "Moss Charm", rarity: "Uncommon" },
    { id: "chest-6", name: "Soft Timber", rarity: "Common" },
  ],
};
