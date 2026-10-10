import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { createHandlers } from '@/mocks/handlers'
import { server } from '@/mocks/node'

import { ApiError, retryDelay, shouldRetry } from './client'
import {
  createQueryClient,
  queryKeys,
  useCategoryBreakdown,
  useFilters,
  useGoals,
  useProfile,
  useSpendingSummary,
  useTransactions,
  useTrends,
} from './queries'

// Scenarios of #12, run against the mock API from #11.

const NOW = new Date('2024-09-16T12:00:00Z')

function setup(options: { slowDelayMs?: number } = {}) {
  server.use(
    ...createHandlers({
      seed: 1,
      now: () => NOW,
      ...(options.slowDelayMs !== undefined && {
        scenario: 'slow',
        slowDelayMs: options.slowDelayMs,
      }),
    }),
  )
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe('query hooks', () => {
  it('return parsed, typed data from each endpoint', async () => {
    const { wrapper } = setup()

    const { result } = renderHook(
      () => ({
        profile: useProfile(),
        summary: useSpendingSummary({ period: '30d' }),
        categories: useCategoryBreakdown({ period: '30d' }),
        trends: useTrends({ months: 6 }),
        transactions: useTransactions({ limit: 5 }),
        goals: useGoals(),
        filters: useFilters(),
      }),
      { wrapper },
    )

    // Seven requests at once: the default 1 s wait was flaky on a busy machine,
    // and how long they take is not what this test checks.
    await waitFor(
      () => {
        expect(Object.values(result.current).every((query) => query.isSuccess)).toBe(true)
      },
      { timeout: 5000 },
    )
    expect(result.current.profile.data?.name).toBe('John Doe')
    expect(result.current.summary.data?.period).toBe('30d')
    expect(result.current.categories.data?.categories.length).toBeGreaterThan(0)
    expect(result.current.trends.data?.trends).toHaveLength(6)
    expect(result.current.transactions.data?.transactions).toHaveLength(5)
    expect(result.current.goals.data?.goals.length).toBeGreaterThan(0)
    expect(result.current.filters.data?.categories).toHaveLength(6)
  })

  it('send only contract values, whatever the input (A9, threat T4)', async () => {
    const { wrapper } = setup()

    // The strict mock answers 400 to an invalid period, so success proves the default was sent.
    const { result } = renderHook(() => useSpendingSummary({ period: '999d' }), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    expect(result.current.data?.period).toBe('30d')
  })

  it('expose failures as an ApiError', async () => {
    const { wrapper } = setup()
    server.use(
      http.get('*/api/customers/12345/goals', () => new HttpResponse(null, { status: 500 })),
    )

    const { result } = renderHook(() => useGoals(), { wrapper })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
    expect(result.current.error).toBeInstanceOf(ApiError)
  })

  it('cache each filter combination separately', async () => {
    const { queryClient, wrapper } = setup()

    const { result, rerender } = renderHook(({ period }) => useSpendingSummary({ period }), {
      wrapper,
      initialProps: { period: '7d' },
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    rerender({ period: '90d' })
    await waitFor(() => {
      expect(result.current.data?.period).toBe('90d')
    })

    expect(queryClient.getQueryData(queryKeys.summary({ period: '7d' }))).toMatchObject({
      period: '7d',
    })
    expect(queryClient.getQueryData(queryKeys.summary({ period: '90d' }))).toMatchObject({
      period: '90d',
    })
  })

  it('cancel a superseded request when the parameters change, discarding its late answer', async () => {
    const { queryClient, wrapper } = setup({ slowDelayMs: 200 })

    const { result, rerender } = renderHook(({ period }) => useSpendingSummary({ period }), {
      wrapper,
      initialProps: { period: '7d' },
    })
    await waitFor(() => {
      expect(result.current.isFetching).toBe(true)
    })
    rerender({ period: '1y' })
    await waitFor(() => {
      expect(result.current.data?.period).toBe('1y')
    })
    // Long enough for the cancelled 7d response to have arrived, had it not been aborted.
    await delay(250)

    expect(queryClient.getQueryState(queryKeys.summary({ period: '7d' }))).toMatchObject({
      status: 'pending',
      fetchStatus: 'idle',
      data: undefined,
    })
  })

  it('keep the previous page on screen while the next one loads (NFR P7)', async () => {
    const { wrapper } = setup({ slowDelayMs: 100 })

    const { result, rerender } = renderHook(({ offset }) => useTransactions({ offset }), {
      wrapper,
      initialProps: { offset: 0 },
    })
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    const firstPage = result.current.data

    rerender({ offset: 20 })

    expect(result.current.data).toBe(firstPage)
    expect(result.current.isPlaceholderData).toBe(true)
    await waitFor(() => {
      expect(result.current.data?.pagination.offset).toBe(20)
    })
  })
})

describe('queryKeys', () => {
  it('give the same key for the same parameters and different keys otherwise', () => {
    expect(queryKeys.summary({ period: '7d' })).toEqual(queryKeys.summary({ period: '7d' }))
    expect(queryKeys.summary({ period: '7d' })).not.toEqual(queryKeys.summary({ period: '30d' }))
    expect(queryKeys.transactions({ limit: 20, offset: 0, sortBy: 'date_desc' })).not.toEqual(
      queryKeys.transactions({ limit: 20, offset: 20, sortBy: 'date_desc' }),
    )
  })

  it('all start with the customer, so a sign-out can clear one customer at once', () => {
    expect(queryKeys.goals().slice(0, 2)).toEqual(['customer', '12345'])
  })
})

describe('createQueryClient', () => {
  it('uses the retry policy from the client (NFR R4)', () => {
    const queries = createQueryClient().getDefaultOptions().queries

    expect(queries?.retry).toBe(shouldRetry)
    expect(queries?.retryDelay).toBe(retryDelay)
  })
})
