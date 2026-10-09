import type { SortBy } from '@/shared/api/params'
import type { GoalStatus, Period } from '@/shared/api/schemas'
import type { Cents } from '@/shared/lib/money'

import { CATEGORIES, type CategoryName } from './catalogue'
import { addDays, addMonths, daysInMonth, sastDate } from './dates'
import type { MockDataset, MockTransaction } from './generate'

// Answers each endpoint's question from the one generated transaction list,
// so every number agrees with every other (A19). Amounts stay in cents here;
// the handlers convert them to rand for the JSON responses.

export interface DateRange {
  startDate: string
  endDate: string
}

export interface Summary {
  period: Period
  totalSpent: Cents
  transactionCount: number
  averageTransaction: Cents
  topCategory: CategoryName | null
  comparedToPrevious: { spentChange: number | null; transactionChange: number | null }
}

export interface CategoryTotal {
  name: CategoryName
  amount: Cents
  percentage: number
  transactionCount: number
  color: string
  icon: string
}

export interface MonthTotal {
  month: string
  totalSpent: Cents
  transactionCount: number
  averageTransaction: Cents
}

export interface Goal {
  id: string
  category: CategoryName
  monthlyBudget: Cents
  currentSpent: Cents
  percentageUsed: number
  daysRemaining: number
  status: Exclude<GoalStatus, 'unknown'>
}

export interface TransactionQuery {
  limit: number
  offset: number
  sortBy: SortBy
  category?: string
  startDate?: string
  endDate?: string
}

export interface TransactionPage {
  transactions: MockTransaction[]
  total: number
  hasMore: boolean
}

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }

/** Budgets as a multiple of recent monthly spending, so the demo shows every status. */
const GOAL_PLANS: readonly { category: CategoryName; factor: number }[] = [
  { category: 'Groceries', factor: 1.05 },
  { category: 'Dining', factor: 1.5 },
  { category: 'Entertainment', factor: 0.85 },
  { category: 'Transportation', factor: 1.2 },
]

const ONE_HUNDRED_RAND = 10000

function dayOf(transaction: MockTransaction): string {
  return sastDate(new Date(transaction.date))
}

function between(transactions: readonly MockTransaction[], range: DateRange): MockTransaction[] {
  return transactions.filter((transaction) => {
    const day = dayOf(transaction)
    return day >= range.startDate && day <= range.endDate
  })
}

function inMonth(transactions: readonly MockTransaction[], month: string): MockTransaction[] {
  return transactions.filter((transaction) => dayOf(transaction).startsWith(month))
}

/** Net of refunds, and never negative (A7). */
function netTotal(transactions: readonly MockTransaction[]): Cents {
  return Math.max(
    0,
    transactions.reduce((total, transaction) => total + transaction.amount, 0),
  ) as Cents
}

function average(total: Cents, count: number): Cents {
  return (count === 0 ? 0 : Math.round(total / count)) as Cents
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/** Percentage change, or null when there is nothing to compare with (A11). */
function change(current: number, previous: number): number | null {
  return previous === 0 ? null : roundTo(((current - previous) / previous) * 100, 1)
}

function totalsByCategory(transactions: readonly MockTransaction[]) {
  return CATEGORIES.map((category) => {
    const items = transactions.filter((transaction) => transaction.category === category.name)
    return { ...category, amount: netTotal(items), transactionCount: items.length }
  })
}

export function periodRange(period: Period, today: string): DateRange {
  return { startDate: addDays(today, -(PERIOD_DAYS[period] - 1)), endDate: today }
}

export function summarise(dataset: MockDataset, period: Period): Summary {
  const range = periodRange(period, dataset.today)
  const days = PERIOD_DAYS[period]
  const current = between(dataset.transactions, range)
  const previous = between(dataset.transactions, {
    startDate: addDays(range.startDate, -days),
    endDate: addDays(range.startDate, -1),
  })
  const totalSpent = netTotal(current)
  const top = totalsByCategory(current).reduce<{ name: CategoryName; amount: number } | null>(
    (best, next) => (next.amount > (best?.amount ?? 0) ? next : best),
    null,
  )

  return {
    period,
    totalSpent,
    transactionCount: current.length,
    averageTransaction: average(totalSpent, current.length),
    topCategory: top?.name ?? null,
    comparedToPrevious: {
      spentChange: change(totalSpent, netTotal(previous)),
      transactionChange: change(current.length, previous.length),
    },
  }
}

export function categoryBreakdown(
  dataset: MockDataset,
  range: DateRange,
): { dateRange: DateRange; totalAmount: Cents; categories: CategoryTotal[] } {
  const totals = totalsByCategory(between(dataset.transactions, range)).filter(
    (category) => category.amount > 0,
  )
  const totalAmount = totals.reduce((total, category) => total + category.amount, 0) as Cents

  return {
    dateRange: range,
    totalAmount,
    // Catalogue order, not sorted: the client must not rely on order (A1).
    categories: totals.map(({ name, amount, transactionCount, color, icon }) => ({
      name,
      amount,
      percentage: roundTo((amount / totalAmount) * 100, 1),
      transactionCount,
      color,
      icon,
    })),
  }
}

export function monthlyTrends(dataset: MockDataset, months: number): MonthTotal[] {
  const currentMonth = dataset.today.slice(0, 7)
  const firstMonth = dataset.startDate.slice(0, 7)

  return Array.from({ length: months }, (_, index) => addMonths(currentMonth, index - months + 1))
    .filter((month) => month >= firstMonth)
    .map((month) => {
      const items = inMonth(dataset.transactions, month)
      const totalSpent = netTotal(items)
      return {
        month,
        totalSpent,
        transactionCount: items.length,
        averageTransaction: average(totalSpent, items.length),
      }
    })
}

export function spendingGoals(dataset: MockDataset): Goal[] {
  const month = dataset.today.slice(0, 7)
  const recentMonths = [1, 2, 3].map((back) => addMonths(month, -back))
  const thisMonth = inMonth(dataset.transactions, month)

  return GOAL_PLANS.map(({ category, factor }, index) => {
    const ofCategory = (items: readonly MockTransaction[]) =>
      items.filter((transaction) => transaction.category === category)
    const typical =
      recentMonths.reduce(
        (total, recent) => total + netTotal(ofCategory(inMonth(dataset.transactions, recent))),
        0,
      ) / recentMonths.length
    // Whole hundreds of rand, as a person would set a budget, and never zero.
    const monthlyBudget = Math.max(
      ONE_HUNDRED_RAND,
      Math.ceil((typical * factor) / ONE_HUNDRED_RAND) * ONE_HUNDRED_RAND,
    ) as Cents
    const currentSpent = netTotal(ofCategory(thisMonth))
    const percentageUsed = roundTo((currentSpent / monthlyBudget) * 100, 2)

    return {
      id: `goal_${String(index + 1).padStart(3, '0')}`,
      category,
      monthlyBudget,
      currentSpent,
      percentageUsed,
      daysRemaining: daysInMonth(month) - Number(dataset.today.slice(8)),
      // Thresholds are our assumption until the backend confirms them (A8).
      status: percentageUsed < 80 ? 'on_track' : percentageUsed <= 100 ? 'warning' : 'exceeded',
    }
  })
}

const COMPARE: Record<SortBy, (a: MockTransaction, b: MockTransaction) => number> = {
  date_desc: (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
  date_asc: (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  amount_desc: (a, b) => b.amount - a.amount || a.id.localeCompare(b.id),
  amount_asc: (a, b) => a.amount - b.amount || a.id.localeCompare(b.id),
}

export function queryTransactions(dataset: MockDataset, query: TransactionQuery): TransactionPage {
  const { category, startDate, endDate } = query
  const matching = dataset.transactions.filter((transaction) => {
    const day = dayOf(transaction)
    return (
      (category === undefined || transaction.category === category) &&
      (startDate === undefined || day >= startDate) &&
      (endDate === undefined || day <= endDate)
    )
  })
  // The id tie-break keeps the order stable, so pages never skip or repeat rows (A16).
  const sorted = [...matching].sort(COMPARE[query.sortBy])

  return {
    transactions: sorted.slice(query.offset, query.offset + query.limit),
    total: sorted.length,
    hasMore: query.offset + query.limit < sorted.length,
  }
}
