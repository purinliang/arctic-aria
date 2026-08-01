export type InstanceDateFilter = "all" | "recent" | "future" | "past";

export function filterInstancesByDate<T extends { scheduledDate: string }>(
  instances: T[],
  filter: InstanceDateFilter,
  referenceDate: string,
) {
  if (filter === "all") {
    return instances;
  }

  const recentStart = addDaysToDateKey(referenceDate, -1);
  const recentEnd = addDaysToDateKey(referenceDate, 3);
  const futureStart = addDaysToDateKey(referenceDate, 4);
  const pastEnd = addDaysToDateKey(referenceDate, -2);

  if (filter === "recent") {
    return instances.filter(
      (instance) =>
        instance.scheduledDate >= recentStart &&
        instance.scheduledDate <= recentEnd,
    );
  }

  if (filter === "future") {
    return instances.filter(
      (instance) => instance.scheduledDate >= futureStart,
    );
  }

  return instances.filter((instance) => instance.scheduledDate <= pastEnd);
}

export function addDaysToDateKey(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}
