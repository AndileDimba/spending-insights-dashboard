import { describe, expect, it } from 'vitest'

import { addDays, addMonths, daysInMonth, sastDate, sastInstant } from './dates'

// South Africa is UTC+2 all year, with no daylight saving.

describe('sastDate', () => {
  it('uses the South African calendar day, not the UTC one (A10)', () => {
    expect(sastDate(new Date('2024-09-15T21:59:00Z'))).toBe('2024-09-15')
    expect(sastDate(new Date('2024-09-15T22:00:00Z'))).toBe('2024-09-16')
  })
})

describe('addDays', () => {
  it.each([
    ['2024-09-16', -29, '2024-08-18'],
    ['2024-02-28', 1, '2024-02-29'],
    ['2024-12-31', 1, '2025-01-01'],
    ['2024-03-01', -1, '2024-02-29'],
  ])('%s plus %i days is %s', (date, days, expected) => {
    expect(addDays(date, days)).toBe(expected)
  })
})

describe('addMonths', () => {
  it.each([
    ['2024-09', -1, '2024-08'],
    ['2024-01', -1, '2023-12'],
    ['2024-11', 3, '2025-02'],
  ])('%s plus %i months is %s', (month, months, expected) => {
    expect(addMonths(month, months)).toBe(expected)
  })
})

describe('daysInMonth', () => {
  it.each([
    ['2024-02', 29],
    ['2023-02', 28],
    ['2024-09', 30],
    ['2024-12', 31],
  ])('%s has %i days', (month, days) => {
    expect(daysInMonth(month)).toBe(days)
  })
})

describe('sastInstant', () => {
  it('turns a South African time into the matching UTC instant', () => {
    expect(sastInstant('2024-09-16', 16, 30).toISOString()).toBe('2024-09-16T14:30:00.000Z')
    expect(sastInstant('2024-09-16', 1, 0).toISOString()).toBe('2024-09-15T23:00:00.000Z')
  })
})
