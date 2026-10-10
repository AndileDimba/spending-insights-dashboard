import { describe, expect, it } from 'vitest'

import {
  formatCalendarDate,
  formatCount,
  formatDateTime,
  formatMoney,
  formatPercent,
  formatShortDate,
} from './format'
import type { Cents } from './money'

// en-ZA separates thousands with a non-breaking space, so a long amount never
// wraps across lines. Tests compare with the spaces made visible.
const visible = (text: string) => text.replace(/\u00a0/g, '·')

describe('formatMoney (ADR 0013, NFR L1)', () => {
  it.each([
    [1542050, 'R·15·420,50'],
    [24580, 'R·245,80'],
    [0, 'R·0,00'],
    [5, 'R·0,05'],
  ])('formats %i cents as %s', (cents, expected) => {
    expect(visible(formatMoney(cents as Cents, 'ZAR'))).toBe(expected)
  })

  it('formats a refund as a negative amount (A7)', () => {
    expect(visible(formatMoney(-24580 as Cents, 'ZAR'))).toBe('-R·245,80')
  })

  it('uses the profile currency rather than assuming rand (A3)', () => {
    expect(visible(formatMoney(1000 as Cents, 'USD'))).toBe('US$10,00')
  })
})

describe('formatCalendarDate', () => {
  it('formats a calendar date in full', () => {
    expect(formatCalendarDate('2023-01-15')).toBe('15 January 2023')
  })

  it('keeps the same day whatever time zone the device is in', () => {
    // A YYYY-MM-DD date is a day, not a moment, so it must never shift.
    expect(formatCalendarDate('2024-03-01')).toBe('1 March 2024')
  })
})

describe('formatDateTime (NFR L2)', () => {
  it('shows a moment in South African time, not the device time zone', () => {
    // Tests run in UTC; 14:30 UTC is 16:30 in South Africa.
    expect(formatDateTime('2024-09-16T14:30:00Z')).toBe('16 Sept 2024, 16:30')
  })

  it('moves a late-evening UTC moment onto the next South African day', () => {
    expect(formatDateTime('2024-09-15T22:30:00Z')).toBe('16 Sept 2024, 00:30')
  })
})

describe('formatPercent', () => {
  it.each([
    [12.5, '12,5%'],
    [3.2, '3,2%'],
    [100, '100%'],
    [96.72, '96,7%'],
  ])('formats %d points as %s, with the en-ZA decimal comma', (points, expected) => {
    expect(formatPercent(points)).toBe(expected)
  })
})

describe('formatCount', () => {
  it('groups thousands with a non-breaking space', () => {
    expect(visible(formatCount(1250))).toBe('1·250')
    expect(formatCount(47)).toBe('47')
  })
})

describe('formatShortDate', () => {
  it('formats a calendar date briefly, as en-ZA abbreviates it', () => {
    expect(formatShortDate('2024-08-16')).toBe('16 Aug 2024')
    // en-ZA abbreviates September as Sept, and its short pattern pads the day.
    expect(formatShortDate('2024-09-01')).toBe('01 Sept 2024')
  })
})
