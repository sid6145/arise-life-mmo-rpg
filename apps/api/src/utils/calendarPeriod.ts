/**
 * Calendar Boundary and Period Key Utilities
 * 
 * Generates deterministic period keys and exact calendar due dates (end of period)
 * in UTC (or specified IANA timezone) for daily, weekly, and monthly cadences.
 */

/**
 * Returns formatted ISO week string "YYYY-Www" (e.g. "2026-W39")
 * following ISO 8601 standard (weeks start on Monday, Week 1 contains Jan 4).
 */
export function getISOWeekString(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // Set to nearest Thursday: current date + 4 - current day number (Monday=1, Sunday=7)
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  const weekStr = weekNo < 10 ? `0${weekNo}` : `${weekNo}`;
  return `${date.getUTCFullYear()}-W${weekStr}`;
}

/**
 * Computes the canonical period key for a given date and quest cadence.
 * - daily: "YYYY-MM-DD"
 * - weekly: "YYYY-Www" (ISO 8601 week)
 * - monthly: "YYYY-MM"
 * - boss / emergency: fallback to "YYYY-MM-DD"
 */
export function computePeriodKey(date: Date, cadence: string): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  switch (cadence) {
    case 'daily':
      return `${year}-${month}-${day}`;
    case 'weekly':
      return getISOWeekString(date);
    case 'monthly':
      return `${year}-${month}`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * Computes the exact calendar boundary expiration date (dueDate) for a given date and cadence.
 * - daily: End of the calendar day 23:59:59.999 UTC
 * - weekly: End of the current ISO week (Sunday 23:59:59.999 UTC)
 * - monthly: End of the current calendar month (Last day 23:59:59.999 UTC)
 */
export function computePeriodDueDate(date: Date, cadence: string): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  switch (cadence) {
    case 'daily': {
      return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    }
    case 'weekly': {
      // ISO week ends on Sunday
      const dayOfWeek = date.getUTCDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
      const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
      return new Date(Date.UTC(year, month, day + daysUntilSunday, 23, 59, 59, 999));
    }
    case 'monthly': {
      // Month ends on the 0th day of next month
      return new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));
    }
    default: {
      return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    }
  }
}
