import { describe, expect, it } from 'vitest'

import { first, specExample } from '@/test/api-spec'

import {
  categoriesSchema,
  filtersSchema,
  goalsSchema,
  profileSchema,
  summarySchema,
  transactionsSchema,
  trendsSchema,
} from './schemas'

// Decision IDs (A1, A2, ...) refer to docs/api-assumptions.md.

const profile = () => specExample(profileSchema, 1)
const summary = () => specExample(summarySchema, 2)
const categories = () => specExample(categoriesSchema, 3)
const trends = () => specExample(trendsSchema, 4)
const transactions = () => specExample(transactionsSchema, 5)
const goals = () => specExample(goalsSchema, 6)
const filters = () => specExample(filtersSchema, 7)

const INJECTED_COLOUR = 'red;background:url(https://evil.example/x)'

describe('money (ADR 0013)', () => {
  it('converts amounts to integer cents', () => {
    const parsed = profileSchema.parse(profile())

    expect(parsed.totalSpent).toBe(1542050)
  })

  it('rounds averages, which may carry more decimals, to the nearest cent (A18)', () => {
    const parsed = summarySchema.parse({ ...summary(), averageTransaction: 90.4415 })

    expect(parsed.averageTransaction).toBe(9044)
  })
})

describe('a malformed payload is rejected, naming the field', () => {
  it('rejects a missing field', () => {
    const { name, ...withoutName } = profile()

    const result = profileSchema.safeParse(withoutName)

    expect(result.error?.issues[0]?.path).toEqual(['name'])
  })

  it('rejects a wrong type', () => {
    const result = summarySchema.safeParse({ ...summary(), transactionCount: '47' })

    expect(result.error?.issues[0]?.path).toEqual(['transactionCount'])
  })

  it('rejects an amount that is not finite', () => {
    // JSON.parse turns 1e309 into Infinity, so a server can really send one.
    const payload = transactions()
    first(payload.transactions).amount = Number.POSITIVE_INFINITY

    const result = transactionsSchema.safeParse(payload)

    expect(result.error?.issues[0]?.path).toEqual(['transactions', 0, 'amount'])
  })

  it('rejects an amount with fractions of a cent (A18)', () => {
    const payload = transactions()
    first(payload.transactions).amount = 245.805

    const result = transactionsSchema.safeParse(payload)

    expect(result.error?.issues[0]?.path).toEqual(['transactions', 0, 'amount'])
  })

  it('rejects a date range that ends before it starts', () => {
    const payload = categories()
    payload.dateRange = { startDate: '2024-09-16', endDate: '2024-08-16' }

    const result = categoriesSchema.safeParse(payload)

    expect(result.error?.issues[0]?.path).toEqual(['dateRange'])
  })

  it('rejects a page size above the contract maximum of 100 (A9)', () => {
    const payload = transactions()
    payload.pagination.limit = 101

    const result = transactionsSchema.safeParse(payload)

    expect(result.error?.issues[0]?.path).toEqual(['pagination', 'limit'])
  })
})

describe('refunds and negative amounts (A7)', () => {
  it('accepts a negative transaction amount as a refund', () => {
    const payload = transactions()
    first(payload.transactions).amount = -245.8

    const parsed = transactionsSchema.parse(payload)

    expect(first(parsed.transactions).amount).toBe(-24580)
  })

  it.each([
    [
      'summary total',
      () => summarySchema.safeParse({ ...summary(), totalSpent: -1 }),
      ['totalSpent'],
    ],
    [
      'category amount',
      () => {
        const payload = categories()
        first(payload.categories).amount = -1
        return categoriesSchema.safeParse(payload)
      },
      ['categories', 0, 'amount'],
    ],
    [
      'goal spending',
      () => {
        const payload = goals()
        first(payload.goals).currentSpent = -1
        return goalsSchema.safeParse(payload)
      },
      ['goals', 0, 'currentSpent'],
    ],
  ])('rejects a negative %s', (_name, parse, path) => {
    expect(parse().error?.issues[0]?.path).toEqual(path)
  })
})

describe('goal status (A8)', () => {
  it.each(['on_track', 'warning', 'exceeded'])('keeps the known status %s', (status) => {
    const payload = goals()
    first(payload.goals).status = status

    expect(first(goalsSchema.parse(payload).goals).status).toBe(status)
  })

  it('maps a status the contract does not list to unknown, instead of failing the view', () => {
    const payload = goals()
    first(payload.goals).status = 'paused'

    expect(first(goalsSchema.parse(payload).goals).status).toBe('unknown')
  })
})

describe('colours from the API (A15, threat T2)', () => {
  it('keeps a valid #RRGGBB colour', () => {
    expect(first(categoriesSchema.parse(categories()).categories).color).toBe('#FF6B6B')
  })

  it('replaces a category colour that is not a hex colour with null, so a token is used', () => {
    const payload = categories()
    first(payload.categories).color = INJECTED_COLOUR

    expect(first(categoriesSchema.parse(payload).categories).color).toBeNull()
  })

  it('does the same for transaction and filter colours', () => {
    const transactionPayload = transactions()
    first(transactionPayload.transactions).categoryColor = INJECTED_COLOUR
    const filterPayload = filters()
    first(filterPayload.categories).color = '#FFF'

    expect(
      first(transactionsSchema.parse(transactionPayload).transactions).categoryColor,
    ).toBeNull()
    expect(first(filtersSchema.parse(filterPayload).categories).color).toBeNull()
  })
})

describe('ordering', () => {
  it('sorts categories by amount, largest first, whatever the response order (A1)', () => {
    const names = categoriesSchema.parse(categories()).categories.map((category) => category.name)

    expect(names).toEqual([
      'Groceries',
      'Entertainment',
      'Transportation',
      'Dining',
      'Utilities',
      'Shopping',
    ])
  })

  it('breaks ties in category amount by name, so the order is stable (A1)', () => {
    const payload = categories()
    payload.categories = payload.categories.map((category) => ({ ...category, amount: 100 }))

    const names = categoriesSchema.parse(payload).categories.map((category) => category.name)

    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  it('sorts trend months oldest first (A4)', () => {
    const payload = trends()
    payload.trends.reverse()

    const months = trendsSchema.parse(payload).trends.map((trend) => trend.month)

    expect(months).toEqual(['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'])
  })
})

describe('empty periods and comparisons (A11, A12)', () => {
  it('accepts no comparison when the previous period had no spending', () => {
    const parsed = summarySchema.parse({
      ...summary(),
      comparedToPrevious: { spentChange: null, transactionChange: null },
    })

    expect(parsed.comparedToPrevious.spentChange).toBeNull()
  })

  it('accepts no top category for a period without transactions', () => {
    const parsed = summarySchema.parse({
      ...summary(),
      totalSpent: 0,
      transactionCount: 0,
      averageTransaction: 0,
      topCategory: null,
    })

    expect(parsed.topCategory).toBeNull()
  })
})

describe('data minimisation (NFR PR1, PR4)', () => {
  it('drops the customer email and ID from the profile at the boundary', () => {
    const parsed = profileSchema.parse(profile())

    expect(parsed).not.toHaveProperty('email')
    expect(parsed).not.toHaveProperty('customerId')
  })
})
