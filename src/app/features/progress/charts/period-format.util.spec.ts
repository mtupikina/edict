import { formatPeriodLabel } from './period-format.util';

describe('formatPeriodLabel', () => {
  describe('ISO week', () => {
    it('formats a single-month week range', () => {
      // 2026-W15 is Apr 6 (Mon) – Apr 12 (Sun) 2026
      expect(formatPeriodLabel('2026-W15')).toBe('Apr 6–12, 2026');
    });

    it('formats a week that spans two months', () => {
      // 2026-W14 is Mar 30 (Mon) – Apr 5 (Sun) 2026
      expect(formatPeriodLabel('2026-W14')).toBe('Mar 30 – Apr 5, 2026');
    });

    it('formats a week that spans two years', () => {
      // 2026-W01 is Dec 29 2025 – Jan 4 2026
      expect(formatPeriodLabel('2026-W01')).toBe('Dec 29, 2025 – Jan 4, 2026');
    });
  });

  describe('month', () => {
    it('formats year-month as long month + year', () => {
      expect(formatPeriodLabel('2026-04')).toBe('April 2026');
    });

    it('formats single-digit-padded months correctly', () => {
      expect(formatPeriodLabel('2026-01')).toBe('January 2026');
      expect(formatPeriodLabel('2026-12')).toBe('December 2026');
    });
  });

  describe('day', () => {
    it('formats a year-month-day string', () => {
      expect(formatPeriodLabel('2026-04-25')).toBe('Apr 25, 2026');
    });

    it('strips leading zeros from the day', () => {
      expect(formatPeriodLabel('2026-04-05')).toBe('Apr 5, 2026');
    });
  });

  describe('fallback', () => {
    it('returns the input unchanged for unrecognised formats', () => {
      expect(formatPeriodLabel('2026')).toBe('2026');
      expect(formatPeriodLabel('not-a-period')).toBe('not-a-period');
      expect(formatPeriodLabel('')).toBe('');
    });

    it('is idempotent on already-formatted output', () => {
      const formatted = formatPeriodLabel('2026-W14');
      expect(formatPeriodLabel(formatted)).toBe(formatted);
    });
  });
});
