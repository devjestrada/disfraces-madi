import { DateRange, InsightsPeriodPreset } from '../types';

export function getPeriodRange(preset: InsightsPeriodPreset, custom?: DateRange): DateRange {
  const now = new Date();

  switch (preset) {
    case 'hoy': {
      const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { from, to: now };
    }
    case '7dias': {
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from, to: now };
    }
    case 'mes': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: now };
    }
    case 'anio': {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from, to: now };
    }
    case 'historico':
      return { from: null, to: null };
    case 'personalizado':
      return custom ?? { from: null, to: null };
    default:
      return { from: null, to: null };
  }
}

/**
 * Previous period of equal duration, immediately preceding the active range.
 * Returns null when there's no unambiguous "previous period" (histórico completo, rango personalizado).
 */
export function getPreviousEquivalentRange(
  preset: InsightsPeriodPreset,
  range: DateRange
): DateRange | null {
  if (preset === 'historico' || preset === 'personalizado') {
    return null;
  }

  if (!range.from || !range.to) {
    return null;
  }

  const duration = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - duration),
    to: new Date(range.from.getTime()),
  };
}

export function isWithinRange(date: Date, range: DateRange): boolean {
  if (range.from && date.getTime() < range.from.getTime()) {
    return false;
  }
  if (range.to && date.getTime() > range.to.getTime()) {
    return false;
  }
  return true;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return ((current - previous) / previous) * 100;
}
