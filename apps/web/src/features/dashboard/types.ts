export type TaskStatus = "todo" | "done";

export type DashboardView =
  | "dashboard"
  | "design"
  | "events"
  | "ideas"
  | "projects"
  | "routines"
  | "memories"
  | "settings";

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  projectLabel: string;
  milestoneLabel: string;
  deadline: string;
  status: TaskStatus;
  startDate: string;
  deadlineDate: string;
};

export type RoutineStatus = "pending" | "completed" | "skipped";
export type RoutineReminderState = "idle" | "reminding";

export type Routine = {
  id: string;
  routineId: string;
  title: string;
  description: string | null;
  scheduledDate: string;
  scheduledTime: string;
  status: RoutineStatus;
  reminderState: RoutineReminderState;
  streakText: string;
};

export type RoutineRuleType =
  | "once"
  | "daily"
  | "weekly"
  | "bi_weekly"
  | "monthly_by_date"
  | "day_interval";

export type RoutineDefinition = {
  id: string;
  groupId: string | null;
  groupName: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  estimatedDurationMinutes: number | null;
  ruleType: RoutineRuleType;
  intervalValue: number | null;
  weekdays: number[] | null;
  dayOfMonth: number | null;
  preferredTime: string | null;
  timezone: string;
};

export type RoutineGroupOption = {
  id: string;
  name: string;
  description: string | null;
};

export type EventRuleType = "once" | "daily" | "weekly";
export type EventInstanceStatus = "scheduled" | "canceled";

export type EventGroupOption = {
  id: string;
  name: string;
  description: string | null;
};

export type EventDefinition = {
  id: string;
  groupId: string | null;
  groupName: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  estimatedDurationHours: number | null;
  location: string | null;
  ruleType: EventRuleType;
  scheduledTime: string;
  weekday: number | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type ScheduledEvent = {
  id: string;
  eventId: string;
  title: string;
  description: string | null;
  eventDate: string;
  eventTime: string;
  estimatedDurationHours: number | null;
  location: string | null;
  status: EventInstanceStatus;
  createdAt: string;
  updatedAt: string;
};

export type MemoryCategory = string;
export type BuiltInMemoryCategoryKey =
  | "cuisine"
  | "sightseeing"
  | "movie"
  | "anime"
  | "book"
  | "music"
  | "game"
  | "shopping";

export type PinnedMemoryStatus = "active" | "completed";

export type PinnedMemory = {
  id: string;
  memoryId: string;
  category: MemoryCategory;
  categoryBuiltInKey: BuiltInMemoryCategoryKey | null;
  title: string;
  description: string | null;
  position: number;
  status: PinnedMemoryStatus;
};

export type MemoryRecord = {
  id: string;
  categoryId: string;
  category: MemoryCategory;
  categoryBuiltInKey: BuiltInMemoryCategoryKey | null;
  title: string;
  description: string | null;
  lastDoneDate: string;
  lastDoneText: string;
  doneCount: number;
  pinned: boolean;
};

export type MemorySuggestion = {
  id: string;
  category: MemoryCategory;
  categoryBuiltInKey: BuiltInMemoryCategoryKey | null;
  title: string;
  description: string | null;
  lastDoneDate: string;
  lastDoneText: string;
  doneCount: number;
};

export type MemoryCategoryOption = {
  id: string;
  name: string;
  description: string | null;
  builtInKey: BuiltInMemoryCategoryKey | null;
  iconName: string;
  shownOnDashboard: boolean;
};
