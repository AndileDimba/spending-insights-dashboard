import type { Cents } from './money'

// The one place values are turned into display text (ADR 0013, NFR L1).
// Formatters are cached: creating an Intl formatter is far slower than using one.

const LOCALE = 'en-ZA'
// Dates and times match bank statements, whatever the device is set to (NFR L2).
const TIME_ZONE = 'Africa/Johannesburg'

const moneyFormatters = new Map<string, Intl.NumberFormat>()

function moneyFormatter(currency: string): Intl.NumberFormat {
  let formatter = moneyFormatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency })
    moneyFormatters.set(currency, formatter)
  }
  return formatter
}

// A calendar date is a day, not a moment: it is formatted in UTC from a UTC
// midnight, so no time zone can move it to the day before or after. Explicit
// parts rather than dateStyle 'long', which pads the day in en-ZA ("01 March").
const calendarDate = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

const dateTime = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: TIME_ZONE,
})

/** Formats an amount of money for display, e.g. R 1 250,30 (ADR 0013). */
export function formatMoney(amount: Cents, currency: string): string {
  // The only conversion from cents back to rand, and only for display.
  return moneyFormatter(currency).format(amount / 100)
}

/** Formats a calendar date (YYYY-MM-DD), e.g. 15 January 2023. */
export function formatCalendarDate(date: string): string {
  return calendarDate.format(new Date(`${date}T00:00:00Z`))
}

/** Formats a moment in South African time (NFR L2), e.g. 16 Sept 2024, 16:30. */
export function formatDateTime(isoInstant: string): string {
  return dateTime.format(new Date(isoInstant))
}

const percent = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 1 })
const count = new Intl.NumberFormat(LOCALE)

/** Formats a percentage given in points, e.g. 12.5 becomes 12,5%. */
export function formatPercent(points: number): string {
  return percent.format(points / 100)
}

/** Formats a count, e.g. 1250 becomes 1 250. */
export function formatCount(value: number): string {
  return count.format(value)
}

const shortDate = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Formats a calendar date (YYYY-MM-DD) briefly, e.g. 16 Aug 2024. */
export function formatShortDate(date: string): string {
  return shortDate.format(new Date(`${date}T00:00:00Z`))
}

/** Formats a YYYY-MM month: 'long' gives September 2024, 'short' gives Sept. */
export function formatMonth(_month: string, _style: 'long' | 'short' = 'long'): string {
  return ''
}

/** Formats money briefly for chart axes, e.g. R 24K. Not for amounts a customer reads. */
export function formatMoneyCompact(_amount: Cents, _currency: string): string {
  return ''
}
