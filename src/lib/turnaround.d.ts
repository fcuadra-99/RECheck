export type ExcludedWeekdays = number[];
export declare function computeDueDate(assignedAt: string | Date, turnaroundDays?: number, excludedWeekdays?: ExcludedWeekdays): string;
export declare function businessDaysBetween(startAt: string | Date, endAt: string | Date, excludedWeekdays?: ExcludedWeekdays): number;
