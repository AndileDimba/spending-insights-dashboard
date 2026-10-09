import { describe, expect, it } from 'vitest'
import type { ZodType } from 'zod'

import {
  categoriesSchema,
  filtersSchema,
  goalsSchema,
  profileSchema,
  summarySchema,
  transactionsSchema,
  trendsSchema,
} from '@/shared/api/schemas'

import { CATEGORIES } from './data/catalogue'
import { createHandlers, type MockApiOptions } from './handlers'
import { server } from './node'

// Decision IDs (A1, A2, ...) refer to docs/api-assumptions.md.

const NOW = new Date('2024-09-16T12:00:00Z')
const BASE = `${location.origin}/api/customers/12345`

function useMockApi(options: MockApiOptions = {}) {
  server.use(...createHandlers({ seed: 1, now: () => NOW, ...options }))
}

async function get(path: string): Promise<{ status: number; type: string | null; body: unknown }> {
  const response = await fetch(`${BASE}${path}`)
  return {
    status: response.status,
    type: response.headers.get('content-type'),
    body: await response.json(),
  }
}

const endpoints: [string, ZodType][] = [
  ['/profile', profileSchema],
  ['/spending/summary', summarySchema],
  ['/spending/summary?period=1y', summarySchema],
  ['/spending/categories', categoriesSchema],
  ['/spending/categories?startDate=2024-08-01&endDate=2024-08-31', categoriesSchema],
  ['/spending/trends', trendsSchema],
  ['/spending/trends?months=24', trendsSchema],
  ['/transactions', transactionsSchema],
  ['/transactions?category=Groceries&sortBy=amount_asc&limit=100&offset=20', transactionsSchema],
  ['/goals', goalsSchema],
  ['/filters', filtersSchema],
]

describe('every mock response honours the contract', () => {
  it.each(endpoints)('GET %s passes its Zod schema', async (path, schema) => {
    useMockApi()

    const { status, body } = await get(path)

    expect(status).toBe(200)
    expect(schema.safeParse(body).error?.issues ?? []).toEqual([])
  })
})

describe('defaults match the contract', () => {
  it('summarises the last 30 days when no period is given', async () => {
    useMockApi()

    expect((await get('/spending/summary')).body).toMatchObject({ period: '30d' })
  })

  it('returns 12 months of trends when no number is given', async () => {
    useMockApi()

    const { body } = await get('/spending/trends')

    expect(trendsSchema.parse(body).trends).toHaveLength(12)
  })

  it('pages transactions 20 at a time from the start', async () => {
    useMockApi()

    const { body } = await get('/transactions')

    expect(transactionsSchema.parse(body).pagination).toMatchObject({
      limit: 20,
      offset: 0,
      hasMore: true,
    })
  })
})

describe('query parameters are honoured', () => {
  it('filters, sorts and pages transactions with a correct total', async () => {
    useMockApi()

    const { body } = await get(
      '/transactions?category=Dining&startDate=2024-08-01&endDate=2024-08-31&sortBy=amount_desc&limit=5&offset=5',
    )
    const page = transactionsSchema.parse(body)
    const all = transactionsSchema.parse(
      (
        await get(
          '/transactions?category=Dining&startDate=2024-08-01&endDate=2024-08-31&sortBy=amount_desc&limit=100',
        )
      ).body,
    )

    expect(page.transactions.map((transaction) => transaction.id)).toEqual(
      all.transactions.slice(5, 10).map((transaction) => transaction.id),
    )
    expect(page.pagination).toEqual({
      total: all.pagination.total,
      limit: 5,
      offset: 5,
      hasMore: true,
    })
  })

  it('uses the date range rather than the period for categories when both are sent (A2)', async () => {
    useMockApi()

    const { body } = await get(
      '/spending/categories?period=7d&startDate=2024-08-01&endDate=2024-08-31',
    )

    expect(body).toMatchObject({ dateRange: { startDate: '2024-08-01', endDate: '2024-08-31' } })
  })

  it('returns categories unsorted, as the spec example does, so the client must sort (A1)', async () => {
    useMockApi()

    const { body } = await get('/spending/categories')
    const names = (body as { categories: { name: string }[] }).categories.map(
      (category) => category.name,
    )

    expect(names).toEqual(
      CATEGORIES.map((category) => category.name).filter((name) => names.includes(name)),
    )
  })

  it('adds the category icon and colour to each transaction', async () => {
    useMockApi()

    const { body } = await get('/transactions?category=Groceries&limit=1')

    expect(transactionsSchema.parse(body).transactions[0]).toMatchObject({
      icon: 'shopping-cart',
      categoryColor: '#FF6B6B',
    })
  })
})

describe('invalid requests are rejected with Problem Details (A5, A9)', () => {
  it.each([
    '/spending/summary?period=999d',
    '/spending/trends?months=25',
    '/spending/trends?months=abc',
    '/transactions?limit=101',
    '/transactions?limit=0',
    '/transactions?offset=-1',
    '/transactions?sortBy=merchant',
    '/transactions?startDate=2024-02-30',
    '/transactions?startDate=2024-09-16&endDate=2024-08-16',
    '/spending/categories?startDate=2024-08-01',
  ])('GET %s is a 400', async (path) => {
    useMockApi()

    const { status, type, body } = await get(path)

    expect(status).toBe(400)
    expect(type).toContain('application/problem+json')
    expect(body).toMatchObject({ status: 400, title: 'Bad Request' })
  })

  it('answers 404 for any customer other than the signed-in one (A6)', async () => {
    useMockApi()

    const response = await fetch(`${location.origin}/api/customers/99999/profile`)

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ status: 404 })
  })
})

describe('failure modes can be demonstrated', () => {
  it('fails every endpoint with a 500 in the error scenario', async () => {
    useMockApi({ scenario: 'error' })

    for (const [path] of endpoints) {
      const { status, body } = await get(path)
      expect(status).toBe(500)
      expect(body).toMatchObject({ status: 500 })
    }
  })

  it('has no spending in the empty scenario, but still answers', async () => {
    useMockApi({ scenario: 'empty' })

    expect(summarySchema.parse((await get('/spending/summary')).body)).toMatchObject({
      totalSpent: 0,
      transactionCount: 0,
      topCategory: null,
    })
    expect(transactionsSchema.parse((await get('/transactions')).body).transactions).toEqual([])
  })

  it('waits before answering in the slow scenario', async () => {
    useMockApi({ scenario: 'slow', slowDelayMs: 150 })

    const started = performance.now()
    const { status } = await get('/profile')

    expect(status).toBe(200)
    expect(performance.now() - started).toBeGreaterThanOrEqual(140)
  })
})
