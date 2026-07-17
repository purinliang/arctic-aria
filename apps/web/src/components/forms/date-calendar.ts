export type CalendarMonth = {
  year: number;
  monthIndex: number;
};

export type CalendarDayCell = {
  day: number;
  value: string;
} | null;

const calendarGridCellCount = 42;

export function shiftCalendarMonth(
  month: CalendarMonth,
  monthOffset: number,
): CalendarMonth {
  const date = new Date(month.year, month.monthIndex + monthOffset, 1);
  return { year: date.getFullYear(), monthIndex: date.getMonth() };
}

export function buildCalendarMonthDays(month: CalendarMonth) {
  const firstDay = new Date(month.year, month.monthIndex, 1).getDay();
  const count = new Date(month.year, month.monthIndex + 1, 0).getDate();
  const days: CalendarDayCell[] = [];

  for (let index = 0; index < firstDay; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= count; day += 1) {
    days.push({
      day,
      value: toDateValue(month.year, month.monthIndex, day),
    });
  }

  while (days.length < calendarGridCellCount) {
    days.push(null);
  }

  return days;
}

function toDateValue(year: number, monthIndex: number, day: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
