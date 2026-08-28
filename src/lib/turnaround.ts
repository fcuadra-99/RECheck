export type ExcludedWeekdays = number[]; // 0 = Sunday, 6 = Saturday

export function computeDueDate(assignedAt: string | Date, turnaroundDays = 15, excludedWeekdays: ExcludedWeekdays = [0, 6]): string {
  const start = typeof assignedAt === 'string' ? new Date(assignedAt) : new Date(assignedAt);
  if (isNaN(start.getTime())) throw new Error('Invalid assignedAt');

  let daysAdded = 0;
  let cursor = new Date(start);
  // Move cursor to next day so that assignment day is not counted as a turnaround day
  cursor.setDate(cursor.getDate() + 1);

  while (daysAdded < turnaroundDays) {
    const wd = cursor.getDay();
    if (!excludedWeekdays.includes(wd)) {
      daysAdded += 1;
    }
    if (daysAdded >= turnaroundDays) break;
    cursor.setDate(cursor.getDate() + 1);
  }

  // Return ISO string without milliseconds for consistency
  return new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()).toISOString();
}

export function businessDaysBetween(startAt: string | Date, endAt: string | Date, excludedWeekdays: ExcludedWeekdays = [0, 6]): number {
  const start = typeof startAt === 'string' ? new Date(startAt) : new Date(startAt);
  const end = typeof endAt === 'string' ? new Date(endAt) : new Date(endAt);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

  // If end is before start return negative days
  const forward = end.getTime() >= start.getTime();
  const from = forward ? new Date(start) : new Date(end);
  const to = forward ? new Date(end) : new Date(start);

  // Count business days excluding start day
  let count = 0;
  const cursor = new Date(from);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor.getTime() <= to.getTime()) {
    if (!excludedWeekdays.includes(cursor.getDay())) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }

  return forward ? count : -count;
}
