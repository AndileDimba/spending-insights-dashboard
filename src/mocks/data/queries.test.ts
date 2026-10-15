import { beforeAll, describe, expect, it } from 'vitest'

import type { Cents } from '@/shared/lib/money'

import { CATEGORIES, type CategoryName } from './catalogue'
import { sastDate } from './dates'
import { generateDataset, type MockDataset, type MockTransaction } from './generate'
import {
  categoryBreakdown,
  type DateRange,
  type Goal,
  monthlyTrends,
  periodRange,
  queryTransactions,
  spendingGoals,
  summarise,
  type Summary,
} from './queries'

// Decision IDs (A1, A2, ...) refer to docs/api-assumptions.md.

const NOW = new Date('2024-09-16T12:00:00Z')
const dataset = generateDataset({ seed: 1, now: NOW })
const empty: MockDataset = { ...dataset, transactions: [] }

function within(range: DateRange): MockTransaction[] {
  return dataset.transactions.filter((transaction) => {
    const day = sastDate(new Date(transaction.date))
    return day >= range.startDate && day <= range.endDate
  })
}

function sum(transactions: readonly MockTransaction[]): number {
  return transactions.reduce((total, transaction) => total + transaction.amount, 0)
}

// A21: spending is purchases; refunds are reported on their own.
function purchases(transactions: readonly MockTransaction[]): MockTransaction[] {
  return transactions.filter((transaction) => transaction.amount > 0)
}

function refunds(transactions: readonly MockTransaction[]): MockTransaction[] {
  return transactions.filter((transaction) => transaction.amount < 0)
}

function transaction(category: CategoryName, amount: number, date: string): MockTransaction {
  return {
    id: `${category}-${String(amount)}`,
    date,
    merchant: category,
    category,
    amount: amount as Cents,
    description: '',
    paymentMethod: 'Debit Card',
  }
}

describe('periodRange (A10)', () => {
  it.each([
    ['7d', '2024-09-10'],
    ['30d', '2024-08-18'],
    ['90d', '2024-06-19'],
    // 365 days, not a calendar year: this window includes 29 February 2024.
    ['1y', '2023-09-18'],
  ] as const)('%s covers exactly that many days, ending today: from %s', (period, startDate) => {
    expect(periodRange(period, '2024-09-16')).toEqual({ startDate, endDate: '2024-09-16' })
  })
})

describe('summarise', () => {
  let range: DateRange
  let summary: Summary
  beforeAll(() => {
    range = periodRange('30d', dataset.today)
    summary = summarise(dataset, '30d')
  })

  it('totals the purchases in the period, and the refunds on their own (A21)', () => {
    expect(refunds(within(range)).length).toBeGreaterThan(0)
    expect(summary.totalSpent).toBe(sum(purchases(within(range))))
    expect(summary.transactionCount).toBe(purchases(within(range)).length)
    expect(summary.refunds).toEqual({
      totalAmount: -sum(refunds(within(range))),
      transactionCount: refunds(within(range)).length,
    })
  })

  it('averages the total over the number of purchases, to the cent', () => {
    expect(summary.averageTransaction).toBe(
      Math.round(summary.totalSpent / summary.transactionCount),
    )
  })

  it('names the category with the most spending as the top category', () => {
    const byCategory = CATEGORIES.map((category) => ({
      name: category.name,
      total: sum(
        purchases(within(range)).filter((transaction) => transaction.category === category.name),
      ),
    }))
    const top = byCategory.reduce((best, next) => (next.total > best.total ? next : best))

    expect(summary.topCategory).toBe(top.name)
  })

  it('compares with the same number of days immediately before', () => {
    const previous = purchases(within({ startDate: '2024-07-19', endDate: '2024-08-17' }))
    const expected = ((summary.totalSpent - sum(previous)) / sum(previous)) * 100

    expect(summary.comparedToPrevious.spentChange).toBe(Math.round(expected * 10) / 10)
  })

  it('reports nothing to compare when the previous period had no spending (A11)', () => {
    const onlyCurrent = { ...dataset, transactions: within(range) }

    expect(summarise(onlyCurrent, '30d').comparedToPrevious).toEqual({
      spentChange: null,
      transactionChange: null,
    })
  })

  it('reports an empty period with zeros and no top category (A12)', () => {
    expect(summarise(empty, '7d')).toMatchObject({
      totalSpent: 0,
      transactionCount: 0,
      averageTransaction: 0,
      topCategory: null,
      refunds: { totalAmount: 0, transactionCount: 0 },
    })
  })
})

// The review that found this: a refund larger than a category's purchases
// made that category vanish, so the categories no longer added up (A21).
describe('purchases and refunds reconcile (A21)', () => {
  const today = '2024-09-16'
  const day = '2024-09-15T10:00:00Z'
  const mixed: MockDataset = {
    startDate: '2024-09-01',
    today,
    transactions: [transaction('Groceries', 10000, day), transaction('Shopping', -5000, day)],
  }

  it('reports a R100 purchase and a R50 refund in another category as both', () => {
    expect(summarise(mixed, '7d')).toMatchObject({
      totalSpent: 10000,
      transactionCount: 1,
      refunds: { totalAmount: 5000, transactionCount: 1 },
    })
    expect(categoryBreakdown(mixed, periodRange('7d', today))).toMatchObject({
      totalAmount: 10000,
      categories: [{ name: 'Groceries', amount: 10000, percentage: 100, transactionCount: 1 }],
    })
  })

  it('reports a period with only refunds as no spending, with its refunds', () => {
    const onlyRefunds = { ...mixed, transactions: [transaction('Shopping', -5000, day)] }

    expect(summarise(onlyRefunds, '7d')).toMatchObject({
      totalSpent: 0,
      transactionCount: 0,
      refunds: { totalAmount: 5000, transactionCount: 1 },
    })
    expect(categoryBreakdown(onlyRefunds, periodRange('7d', today)).categories).toEqual([])
  })

  it.each(['7d', '30d', '90d', '1y'] as const)(
    'agrees across summary, categories and transactions for %s',
    (period) => {
      const summary = summarise(dataset, period)
      const breakdown = categoryBreakdown(dataset, periodRange(period, dataset.today))
      const all = within(periodRange(period, dataset.today))
      const categoryTotal = breakdown.categories.reduce((total, c) => total + c.amount, 0)

      expect(categoryTotal).toBe(summary.totalSpent)
      expect(breakdown.totalAmount).toBe(summary.totalSpent)
      expect(summary.totalSpent - summary.refunds.totalAmount).toBe(sum(all))
      expect(summary.transactionCount + summary.refunds.transactionCount).toBe(all.length)
    },
  )
})

describe('categoryBreakdown', () => {
  let range: DateRange
  let breakdown: ReturnType<typeof categoryBreakdown>
  beforeAll(() => {
    range = periodRange('30d', dataset.today)
    breakdown = categoryBreakdown(dataset, range)
  })

  it('agrees with the summary for the same period (A19)', () => {
    expect(breakdown.totalAmount).toBe(summarise(dataset, '30d').totalSpent)
    expect(breakdown.dateRange).toEqual(range)
  })

  it('splits the total into categories whose amounts and percentages add up', () => {
    const amounts = breakdown.categories.reduce((total, category) => total + category.amount, 0)
    const percentages = breakdown.categories.reduce(
      (total, category) => total + category.percentage,
      0,
    )

    expect(amounts).toBe(breakdown.totalAmount)
    expect(percentages).toBeCloseTo(100, 0)
  })

  it('counts transactions per category and carries the category colour and icon', () => {
    const groceries = breakdown.categories.find((category) => category.name === 'Groceries')

    expect(groceries).toMatchObject({ color: '#FF6B6B', icon: 'shopping-cart' })
    expect(groceries?.transactionCount).toBe(
      purchases(within(range)).filter((transaction) => transaction.category === 'Groceries').length,
    )
  })

  it('returns categories in catalogue order, leaving sorting to the client (A1)', () => {
    const order = CATEGORIES.map((category) => category.name).filter((name) =>
      breakdown.categories.some((category) => category.name === name),
    )

    expect(breakdown.categories.map((category) => category.name)).toEqual(order)
  })

  it('has no categories for a range without transactions', () => {
    expect(categoryBreakdown(empty, range)).toMatchObject({ totalAmount: 0, categories: [] })
  })
})

describe('monthlyTrends (A4)', () => {
  it('returns the requested months, oldest first, ending with the current month', () => {
    const months = monthlyTrends(dataset, 12).map((trend) => trend.month)

    expect(months).toHaveLength(12)
    expect(months[0]).toBe('2023-10')
    expect(months.at(-1)).toBe('2024-09')
  })

  it('returns only the months that have data when more are requested', () => {
    expect(monthlyTrends(dataset, 24)).toHaveLength(18)
  })

  it('totals each month from its purchases (A21)', () => {
    const august = monthlyTrends(dataset, 2)[0]
    const augustTransactions = purchases(within({ startDate: '2024-08-01', endDate: '2024-08-31' }))

    expect(august).toEqual({
      month: '2024-08',
      totalSpent: sum(augustTransactions),
      transactionCount: augustTransactions.length,
      averageTransaction: Math.round(sum(augustTransactions) / augustTransactions.length),
    })
  })
})

describe('spendingGoals (A8)', () => {
  let goals: Goal[]
  beforeAll(() => {
    goals = spendingGoals(dataset)
  })

  it('measures this month’s purchases against each budget (A21)', () => {
    for (const goal of goals) {
      const spent = sum(
        purchases(within({ startDate: '2024-09-01', endDate: '2024-09-16' })).filter(
          (transaction) => transaction.category === goal.category,
        ),
      )
      expect(goal.currentSpent).toBe(spent)
      expect(goal.percentageUsed).toBe(Math.round((spent / goal.monthlyBudget) * 10000) / 100)
      expect(goal.daysRemaining).toBe(14)
    }
  })

  it('sets the status from the share of the budget used: under 80%, up to 100%, over 100%', () => {
    for (const goal of goals) {
      const expected =
        goal.percentageUsed < 80 ? 'on_track' : goal.percentageUsed <= 100 ? 'warning' : 'exceeded'
      expect(goal.status).toBe(expected)
    }
  })

  it.each(['2024-09-12T12:00:00Z', '2024-09-16T12:00:00Z', '2024-09-28T12:00:00Z'])(
    'shows every status in the demo, whatever the day of the month (%s)',
    (now) => {
      const statuses = spendingGoals(generateDataset({ seed: 1, now: new Date(now) })).map(
        (goal) => goal.status,
      )

      expect(new Set(statuses)).toEqual(new Set(['on_track', 'warning', 'exceeded']))
    },
  )

  it('has unique ids and budgets in whole rand', () => {
    expect(new Set(goals.map((goal) => goal.id)).size).toBe(goals.length)
    expect(goals.every((goal) => goal.monthlyBudget % 100 === 0)).toBe(true)
  })
})

describe('queryTransactions', () => {
  const defaults = { limit: 20, offset: 0, sortBy: 'date_desc' } as const

  it('returns the newest 20 by default, with the total and whether there is more', () => {
    const page = queryTransactions(dataset, defaults)

    expect(page.transactions).toHaveLength(20)
    expect(page.transactions[0]).toEqual(dataset.transactions.at(-1))
    expect(page.total).toBe(dataset.transactions.length)
    expect(page.hasMore).toBe(true)
  })

  it('filters by exact category name (A13)', () => {
    const page = queryTransactions(dataset, { ...defaults, category: 'Dining', limit: 100 })

    expect(page.transactions.every((transaction) => transaction.category === 'Dining')).toBe(true)
    expect(page.total).toBe(dataset.transactions.filter((t) => t.category === 'Dining').length)
    expect(queryTransactions(dataset, { ...defaults, category: 'dining' }).total).toBe(0)
  })

  it('filters by South African calendar dates, including both ends (A10)', () => {
    const range = { startDate: '2024-09-01', endDate: '2024-09-07' }
    const page = queryTransactions(dataset, { ...defaults, ...range, limit: 100 })

    expect(page.total).toBe(within(range).length)
  })

  it('sorts by amount with ties broken by id, so pages never overlap (A16)', () => {
    const all = queryTransactions(dataset, { ...defaults, sortBy: 'amount_desc', limit: 100 })
    const amounts = all.transactions.map((transaction) => transaction.amount)
    const next = queryTransactions(dataset, {
      ...defaults,
      sortBy: 'amount_desc',
      offset: 100,
      limit: 100,
    })

    expect(amounts).toEqual([...amounts].sort((a, b) => b - a))
    expect(next.transactions[0]?.amount).toBeLessThanOrEqual(amounts.at(-1) ?? 0)
    const ids = new Set(all.transactions.map((transaction) => transaction.id))
    expect(next.transactions.some((transaction) => ids.has(transaction.id))).toBe(false)
  })

  it('pages through every transaction exactly once', () => {
    const seen: string[] = []
    for (let offset = 0; offset < dataset.transactions.length; offset += 100) {
      seen.push(
        ...queryTransactions(dataset, { ...defaults, offset, limit: 100 }).transactions.map(
          (t) => t.id,
        ),
      )
    }

    expect(seen).toHaveLength(dataset.transactions.length)
    expect(new Set(seen).size).toBe(dataset.transactions.length)
  })

  it('returns an empty last page past the end (A16)', () => {
    const page = queryTransactions(dataset, { ...defaults, offset: 100000 })

    expect(page).toMatchObject({
      transactions: [],
      total: dataset.transactions.length,
      hasMore: false,
    })
  })
})
