// Calendar helpers for mock data. Dates are YYYY-MM-DD strings in South
// African time (A10); arithmetic is done in UTC on those calendar values,
// where every day is exactly 24 hours long.

const DAY_MS = 24 * 60 * 60 * 1000
// South Africa has used UTC+2 all year, with no daylight saving, since 1944.
const SAST_OFFSET_HOURS = 2

const sastCalendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Johannesburg',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function parse(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

/** Calendar date in South African time (A10), as YYYY-MM-DD. */
export function sastDate(instant: Date): string {
  // en-CA formats dates as YYYY-MM-DD.
  return sastCalendar.format(instant)
}

/** Adds whole days to a YYYY-MM-DD date. */
export function addDays(date: string, days: number): string {
  return new Date(parse(date) + days * DAY_MS).toISOString().slice(0, 10)
}

/** Shifts a YYYY-MM month by a number of months. */
export function addMonths(month: string, months: number): string {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber - 1 + months, 1)).toISOString().slice(0, 7)
}

/** Number of days in a YYYY-MM month. */
export function daysInMonth(month: string): number {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number)
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate()
}

/** The instant for a time of day in South African time on a YYYY-MM-DD date. */
export function sastInstant(date: string, hour: number, minute: number): Date {
  return new Date(parse(date) + ((hour - SAST_OFFSET_HOURS) * 60 + minute) * 60 * 1000)
}
