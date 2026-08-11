import { addDays, format, startOfWeek } from 'date-fns'

export function getWeekRange(anchor: Date): { start: Date; end: Date } {
  const start = startOfWeek(anchor, { weekStartsOn: 1 })
  const end = addDays(start, 6)
  return { start, end }
}

export function toIsoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Parses a "yyyy-MM-dd" string as local midnight, avoiding the UTC-parsing
 * pitfall of `new Date(isoString)` (which can shift the date by a day in
 * negative-UTC-offset timezones). */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDisplayDate(date: Date): string {
  return format(date, 'MM/dd (EEE)')
}
