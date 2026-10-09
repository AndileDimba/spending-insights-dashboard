import { describe, expect, it } from 'vitest'

import {
  categoriesParams,
  summaryParams,
  toSearchParams,
  transactionsParams,
  trendsParams,
} from './params'

// Scenario 5 of #10: query parameters stay inside the contract.
// Decision IDs (A2, A9) refer to docs/api-assumptions.md.

describe('period', () => {
  it('defaults to the last 30 days', () => {
    expect(summaryParams({})).toEqual({ period: '30d' })
  })

  it.each(['7d', '30d', '90d', '1y'])('keeps the documented period %s', (period) => {
    expect(summaryParams({ period })).toEqual({ period })
  })

  it.each(['999d', '30D', '', 30, null])(
    'replaces the undocumented period %j with the default',
    (period) => {
      expect(summaryParams({ period })).toEqual({ period: '30d' })
    },
  )
})

describe('categories: period or date range (A2)', () => {
  it('sends the date range instead of the period when both dates are valid', () => {
    expect(
      categoriesParams({ period: '7d', startDate: '2024-08-16', endDate: '2024-09-16' }),
    ).toEqual({ startDate: '2024-08-16', endDate: '2024-09-16' })
  })

  it.each([
    ['only a start date', { startDate: '2024-08-16' }],
    ['only an end date', { endDate: '2024-09-16' }],
    ['a date that does not exist', { startDate: '2024-02-30', endDate: '2024-03-10' }],
    ['a range that ends before it starts', { startDate: '2024-09-16', endDate: '2024-08-16' }],
  ])('falls back to the period when given %s', (_case, dates) => {
    expect(categoriesParams({ period: '90d', ...dates })).toEqual({ period: '90d' })
  })
})

describe('trend months', () => {
  it('defaults to 12 months', () => {
    expect(trendsParams({})).toEqual({ months: 12 })
  })

  it.each([
    [6, 6],
    ['24', 24],
    [60, 24],
    [0, 1],
    [-3, 1],
  ])('turns %j into %i, within the contract range of 1 to 24', (months, expected) => {
    expect(trendsParams({ months })).toEqual({ months: expected })
  })

  it.each(['abc', '', 6.5, null])(
    'uses the default for %j, which is not a whole number',
    (months) => {
      expect(trendsParams({ months })).toEqual({ months: 12 })
    },
  )
})

describe('transactions', () => {
  it('uses the contract defaults: 20 per page, first page, newest first', () => {
    expect(transactionsParams({})).toEqual({ limit: 20, offset: 0, sortBy: 'date_desc' })
  })

  it.each([
    [50, 50],
    ['100', 100],
    [100000, 100],
    [0, 1],
    ['ten', 20],
  ])('turns a limit of %j into %i, never more than 100 (A9)', (limit, expected) => {
    expect(transactionsParams({ limit }).limit).toBe(expected)
  })

  it.each([
    [40, 40],
    ['40', 40],
    [-20, 0],
    ['x', 0],
  ])('turns an offset of %j into %i', (offset, expected) => {
    expect(transactionsParams({ offset }).offset).toBe(expected)
  })

  it.each(['date_desc', 'date_asc', 'amount_desc', 'amount_asc'])(
    'keeps the sort order %s',
    (sortBy) => {
      expect(transactionsParams({ sortBy }).sortBy).toBe(sortBy)
    },
  )

  it('replaces an undocumented sort order with newest first', () => {
    expect(transactionsParams({ sortBy: 'merchant; DROP TABLE' }).sortBy).toBe('date_desc')
  })

  it('trims the category and leaves it out when empty', () => {
    expect(transactionsParams({ category: '  Groceries ' }).category).toBe('Groceries')
    expect(transactionsParams({ category: '   ' })).not.toHaveProperty('category')
  })

  it('keeps a single valid date as an open-ended filter', () => {
    expect(transactionsParams({ startDate: '2024-08-16' })).toMatchObject({
      startDate: '2024-08-16',
    })
    expect(transactionsParams({ startDate: '2024-08-16' })).not.toHaveProperty('endDate')
  })

  it('drops dates that are invalid or form a range that ends before it starts', () => {
    expect(transactionsParams({ startDate: '16/08/2024' })).not.toHaveProperty('startDate')

    const inverted = transactionsParams({ startDate: '2024-09-16', endDate: '2024-08-16' })

    expect(inverted).not.toHaveProperty('startDate')
    expect(inverted).not.toHaveProperty('endDate')
  })

  it('ignores input the endpoint does not accept', () => {
    const params = transactionsParams({ limit: 20, customerId: '999' } as Record<string, unknown>)

    expect(Object.keys(params).sort()).toEqual(['limit', 'offset', 'sortBy'])
  })
})

describe('toSearchParams', () => {
  it('encodes set parameters and leaves out unset ones', () => {
    const query = toSearchParams({ limit: 20, offset: 0, category: undefined, sortBy: 'date_desc' })

    expect(query.toString()).toBe('limit=20&offset=0&sortBy=date_desc')
  })

  it('encodes values, so one cannot add a parameter of its own (threat T4)', () => {
    const query = toSearchParams({ category: 'Groceries&limit=100000' })

    expect([...query.keys()]).toEqual(['category'])
    expect(query.get('category')).toBe('Groceries&limit=100000')
  })
})
