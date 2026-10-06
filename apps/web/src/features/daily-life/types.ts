export const lifeActivities = ['meal', 'shower', 'sleep', 'exercise'] as const;
export type LifeActivity = typeof lifeActivities[number];

export type LifeEntry = {
  id: string;
  activity: LifeActivity;
  occurredAt: string;
  note: string | null;
};

export type LifeInput = {
  id?: string;
  captureKey: string;
  activity: LifeActivity;
  occurredAt?: string;
  note?: string | null;
};

export type LifeRepository = {
  list: (userId: string, timezone: string, now: Date) => Promise<LifeEntry[]>;
  save: (userId: string, input: LifeInput & { occurredAt: string }, now: Date) => Promise<LifeEntry | null>;
  archive: (userId: string, id: string, now: Date) => Promise<boolean>;
};

export type LifeChatTurn = {
  id: string;
  message: string;
  createdAt: string;
  responseCode: 'chat_not_available';
};

export type LifeChatInput = { captureKey: string; message: string };
