import type { Cents } from './money'

/** Formats an amount of money for display, e.g. R 1 250,30 (ADR 0013). */
export function formatMoney(_amount: Cents, _currency: string): string {
  return ''
}

/** Formats a calendar date (YYYY-MM-DD), e.g. 15 January 2023. */
export function formatCalendarDate(_date: string): string {
  return ''
}

/** Formats a moment in South African time (NFR L2), e.g. 16 Sept 2024, 16:30. */
export function formatDateTime(_isoInstant: string): string {
  return ''
}
