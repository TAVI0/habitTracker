/**
 * Returns today's date as "YYYY-MM-DD".
 */
export function today(): string {
  return toISODate(new Date());
}

/**
 * Converts a Date object to an ISO date string "YYYY-MM-DD".
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns true if the given ISO date string is strictly after today.
 */
export function isFuture(date: string): boolean {
  return date > today();
}

/**
 * Returns 7 ISO date strings for the week starting on `weekStart` (Mon–Sun).
 * weekStart must be a "YYYY-MM-DD" ISO string for a Monday.
 */
export function getWeekDates(weekStart: string): string[] {
  const result: string[] = [];
  const base = new Date(weekStart + 'T00:00:00Z');
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    result.push(toISODateUTC(d));
  }
  return result;
}

/**
 * Returns all ISO date strings for a given year.
 */
export function getYearDates(year: number): string[] {
  const result: string[] = [];
  const start = new Date(`${year}-01-01T00:00:00Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00Z`);
  const current = new Date(start);
  while (current < end) {
    result.push(toISODateUTC(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return result;
}

/**
 * Returns the day of the week for an ISO date string.
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 */
export function getDayOfWeek(date: string): number {
  // Parse as UTC to avoid timezone shifts
  const d = new Date(date + 'T00:00:00Z');
  return d.getUTCDay();
}

// Internal helper — formats a UTC Date as YYYY-MM-DD
function toISODateUTC(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
