import { delay, http, type HttpHandler, HttpResponse, type JsonBodyType } from 'msw'
import { z } from 'zod'

import { SORT_ORDERS, type SortBy } from '@/shared/api/params'
import { type Period, periodSchema } from '@/shared/api/schemas'
import type { Cents } from '@/shared/lib/money'

import { CATEGORIES, CUSTOMER } from './data/catalogue'
import { sastDate } from './data/dates'
import { generateDataset, type MockDataset, type MockTransaction } from './data/generate'
import {
  categoryBreakdown,
  type DateRange,
  monthlyTrends,
  periodRange,
  queryTransactions,
  spendingGoals,
  summarise,
} from './data/queries'

// The mock API (ADR 0008). Handlers are strict about parameters, answering
// 400 Problem Details where a real API should (A5, A9), so tests prove the
// client never relies on the server to fix its input.

/** How the mock API behaves: normally, with no data, failing, or slowly. */
export type MockScenario = 'normal' | 'empty' | 'error' | 'slow'

export interface MockApiOptions {
  seed?: number
  now?: () => Date
  scenario?: MockScenario
  /** How long the slow scenario waits before answering. */
  slowDelayMs?: number
}

const DEFAULT_SEED = 20261021

const DATE_RANGE_PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
]

class BadRequest extends Error {}

function problem(status: number, title: string, detail: string): Response {
  return new HttpResponse(JSON.stringify({ type: 'about:blank', title, status, detail }), {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
}

/** Cents back to the rand amounts the contract uses. */
function rand(amount: Cents): number {
  return amount / 100
}

// ---- Strict query parameter parsing (A9) ------------------------------------

function wholeNumber(
  query: URLSearchParams,
  name: string,
  min: number,
  max: number,
  fallback: number,
) {
  const raw = query.get(name)
  if (raw === null) return fallback
  const value = Number(raw)
  if (!/^-?\d+$/.test(raw) || value < min || value > max) {
    throw new BadRequest(`${name} must be a whole number from ${String(min)} to ${String(max)}`)
  }
  return value
}

function period(query: URLSearchParams): Period {
  const result = periodSchema.safeParse(query.get('period') ?? '30d')
  if (!result.success) throw new BadRequest('period must be 7d, 30d, 90d or 1y')
  return result.data
}

function sortBy(query: URLSearchParams): SortBy {
  const result = z.enum(SORT_ORDERS).safeParse(query.get('sortBy') ?? 'date_desc')
  if (!result.success) throw new BadRequest(`sortBy must be one of ${SORT_ORDERS.join(', ')}`)
  return result.data
}

function date(query: URLSearchParams, name: string): string | undefined {
  const raw = query.get(name)
  if (raw === null) return undefined
  if (!z.iso.date().safeParse(raw).success)
    throw new BadRequest(`${name} must be a date as YYYY-MM-DD`)
  return raw
}

function dates(query: URLSearchParams): Partial<DateRange> {
  const startDate = date(query, 'startDate')
  const endDate = date(query, 'endDate')
  if (startDate !== undefined && endDate !== undefined && startDate > endDate) {
    throw new BadRequest('endDate must not be before startDate')
  }
  return {
    ...(startDate !== undefined && { startDate }),
    ...(endDate !== undefined && { endDate }),
  }
}

// ---- Responses ----------------------------------------------------------------

function transactionJson(transaction: MockTransaction) {
  const category = CATEGORIES.find((candidate) => candidate.name === transaction.category)
  return {
    ...transaction,
    amount: rand(transaction.amount),
    icon: category?.icon ?? 'circle',
    categoryColor: category?.color ?? '#9E9E9E',
  }
}

type Answer = (dataset: MockDataset, query: URLSearchParams) => JsonBodyType

const answers: Record<string, Answer> = {
  '/profile': (dataset) => ({
    ...CUSTOMER,
    joinDate: dataset.startDate,
    // Lifetime spending since joining (A17), net of refunds (A7).
    totalSpent: rand(
      Math.max(
        0,
        dataset.transactions.reduce((total, transaction) => total + transaction.amount, 0),
      ) as Cents,
    ),
  }),

  '/spending/summary': (dataset, query) => {
    const summary = summarise(dataset, period(query))
    return {
      ...summary,
      totalSpent: rand(summary.totalSpent),
      averageTransaction: rand(summary.averageTransaction),
    }
  },

  '/spending/categories': (dataset, query) => {
    const { startDate, endDate } = dates(query)
    if ((startDate === undefined) !== (endDate === undefined)) {
      throw new BadRequest('startDate and endDate must be sent together')
    }
    // Explicit dates win over the period (A2).
    const range =
      startDate !== undefined && endDate !== undefined
        ? { startDate, endDate }
        : periodRange(period(query), dataset.today)
    const breakdown = categoryBreakdown(dataset, range)
    return {
      ...breakdown,
      totalAmount: rand(breakdown.totalAmount),
      categories: breakdown.categories.map((category) => ({
        ...category,
        amount: rand(category.amount),
      })),
    }
  },

  '/spending/trends': (dataset, query) => ({
    trends: monthlyTrends(dataset, wholeNumber(query, 'months', 1, 24, 12)).map((trend) => ({
      ...trend,
      totalSpent: rand(trend.totalSpent),
      averageTransaction: rand(trend.averageTransaction),
    })),
  }),

  '/transactions': (dataset, query) => {
    const limit = wholeNumber(query, 'limit', 1, 100, 20)
    const offset = wholeNumber(query, 'offset', 0, Number.MAX_SAFE_INTEGER, 0)
    const category = query.get('category')
    if (category === '') throw new BadRequest('category must not be empty')
    const page = queryTransactions(dataset, {
      limit,
      offset,
      sortBy: sortBy(query),
      ...(category !== null && { category }),
      ...dates(query),
    })
    return {
      transactions: page.transactions.map(transactionJson),
      pagination: { total: page.total, limit, offset, hasMore: page.hasMore },
    }
  },

  '/goals': (dataset) => ({
    goals: spendingGoals(dataset).map((goal) => ({
      ...goal,
      monthlyBudget: rand(goal.monthlyBudget),
      currentSpent: rand(goal.currentSpent),
    })),
  }),

  '/filters': () => ({ categories: CATEGORIES, dateRangePresets: DATE_RANGE_PRESETS }),
}

/** MSW request handlers for the seven endpoints in docs/brief/api-spec.md. */
export function createHandlers({
  seed = DEFAULT_SEED,
  now = () => new Date(),
  scenario = 'normal',
  slowDelayMs = 2500,
}: MockApiOptions = {}): HttpHandler[] {
  // Generated once per day: the same day always gives the same data.
  let cached: { today: string; dataset: MockDataset } | undefined
  function dataset(): MockDataset {
    const current = now()
    const today = sastDate(current)
    if (cached?.today !== today) {
      const generated = generateDataset({ seed, now: current })
      cached = {
        today,
        dataset: scenario === 'empty' ? { ...generated, transactions: [] } : generated,
      }
    }
    return cached.dataset
  }

  return Object.entries(answers).map(([path, answer]) =>
    http.get(`*/api/customers/:customerId${path}`, async ({ params, request }) => {
      if (scenario === 'slow') await delay(slowDelayMs)
      if (scenario === 'error') {
        return problem(500, 'Internal Server Error', 'The mock API is running the error scenario.')
      }
      // One signed-in customer (A6).
      if (params.customerId !== CUSTOMER.customerId) {
        return problem(404, 'Not Found', 'No customer with that ID.')
      }
      try {
        return HttpResponse.json(answer(dataset(), new URL(request.url).searchParams))
      } catch (error) {
        if (error instanceof BadRequest) return problem(400, 'Bad Request', error.message)
        throw error
      }
    }),
  )
}
