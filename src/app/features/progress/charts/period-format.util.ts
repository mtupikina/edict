/**
 * Converts BE period strings into user-friendly labels for chart tooltips.
 *
 * Supported formats:
 *   - ISO week:  `2026-W14`  → `Mar 30 – Apr 5, 2026`
 *   - Month:     `2026-04`   → `April 2026`
 *   - Day:       `2026-04-25`→ `Apr 25, 2026`
 *
 * Falls back to the original string when the format is unrecognised.
 */
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatPeriodLabel(period: string): string {
  const weekMatch = /^(\d{4})-W(\d{2})$/.exec(period);
  if (weekMatch) {
    const { start, end } = isoWeekRange(+weekMatch[1], +weekMatch[2]);
    return formatDateRange(start, end);
  }

  const monthMatch = /^(\d{4})-(\d{2})$/.exec(period);
  if (monthMatch) {
    return `${MONTHS_LONG[+monthMatch[2] - 1]} ${monthMatch[1]}`;
  }

  const dayMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(period);
  if (dayMatch) {
    return `${MONTHS_SHORT[+dayMatch[2] - 1]} ${+dayMatch[3]}, ${dayMatch[1]}`;
  }

  return period;
}

/** Returns Monday/Sunday (UTC) for the given ISO 8601 week. */
function isoWeekRange(year: number, week: number): { start: Date; end: Date } {
  // ISO 8601: Jan 4 is always in week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - dow + 1);

  const start = new Date(week1Monday);
  start.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return { start, end };
}

function formatDateRange(start: Date, end: Date): string {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const sameMonth = sameYear && start.getUTCMonth() === end.getUTCMonth();
  const sM = MONTHS_SHORT[start.getUTCMonth()];
  const eM = MONTHS_SHORT[end.getUTCMonth()];

  if (sameMonth) {
    return `${sM} ${start.getUTCDate()}–${end.getUTCDate()}, ${start.getUTCFullYear()}`;
  }
  if (sameYear) {
    return `${sM} ${start.getUTCDate()} – ${eM} ${end.getUTCDate()}, ${start.getUTCFullYear()}`;
  }
  return `${sM} ${start.getUTCDate()}, ${start.getUTCFullYear()} – ${eM} ${end.getUTCDate()}, ${end.getUTCFullYear()}`;
}
