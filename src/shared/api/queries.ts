import { keepPreviousData, QueryClient, useQuery } from '@tanstack/react-query'

import { getJson, retryDelay, shouldRetry } from './client'
import { CUSTOMER_ID } from './config'
import {
  type CategoriesParams,
  categoriesParams,
  type SummaryParams,
  summaryParams,
  type TransactionsParams,
  transactionsParams,
  type TrendsParams,
  trendsParams,
} from './params'
import {
  categoriesSchema,
  filtersSchema,
  goalsSchema,
  profileSchema,
  summarySchema,
  transactionsSchema,
  trendsSchema,
} from './schemas'

// One hook per endpoint. Components use these and never fetch themselves.
// Every hook passes its input through the parameter builders, so whatever a
// URL or form contains, only contract values are sent (A9, threat T4).

/**
 * Query keys for every endpoint. Each key includes all of its parameters, so
 * every filter combination is cached on its own (ADR 0007). All keys start
 * with the customer, so one customer's data can be cleared at once.
 */
export const queryKeys = {
  all: ['customer', CUSTOMER_ID] as const,
  profile: () => [...queryKeys.all, 'profile'] as const,
  summary: (params: SummaryParams) => [...queryKeys.all, 'summary', params] as const,
  categories: (params: CategoriesParams) => [...queryKeys.all, 'categories', params] as const,
  trends: (params: TrendsParams) => [...queryKeys.all, 'trends', params] as const,
  transactions: (params: TransactionsParams) => [...queryKeys.all, 'transactions', params] as const,
  goals: () => [...queryKeys.all, 'goals'] as const,
  filters: () => [...queryKeys.all, 'filters'] as const,
}

/** The app's query client: retries only what can succeed on a second try (NFR R4). */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, retryDelay, staleTime: 60_000 },
    },
  })
}

/** Fetched once a session: amounts everywhere need its currency (A3). */
export function useProfile() {
  return useQuery({
    queryKey: queryKeys.profile(),
    queryFn: ({ signal }) => getJson('/profile', profileSchema, { signal }),
    staleTime: Infinity,
  })
}

export function useSpendingSummary(input: Parameters<typeof summaryParams>[0]) {
  const params = summaryParams(input)
  return useQuery({
    queryKey: queryKeys.summary(params),
    queryFn: ({ signal }) => getJson('/spending/summary', summarySchema, { params, signal }),
  })
}

export function useCategoryBreakdown(input: Parameters<typeof categoriesParams>[0]) {
  const params = categoriesParams(input)
  return useQuery({
    queryKey: queryKeys.categories(params),
    queryFn: ({ signal }) => getJson('/spending/categories', categoriesSchema, { params, signal }),
  })
}

export function useTrends(input: Parameters<typeof trendsParams>[0]) {
  const params = trendsParams(input)
  return useQuery({
    queryKey: queryKeys.trends(params),
    queryFn: ({ signal }) => getJson('/spending/trends', trendsSchema, { params, signal }),
  })
}

/** The previous page stays on screen while the next one loads (NFR P7). */
export function useTransactions(
  input: Parameters<typeof transactionsParams>[0],
  /** False holds the request, for example until a category can be validated (A13). */
  { enabled = true }: { enabled?: boolean } = {},
) {
  const params = transactionsParams(input)
  return useQuery({
    queryKey: queryKeys.transactions(params),
    queryFn: ({ signal }) => getJson('/transactions', transactionsSchema, { params, signal }),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals(),
    queryFn: ({ signal }) => getJson('/goals', goalsSchema, { signal }),
  })
}

/** Categories and presets change rarely, so they are fetched once a session. */
export function useFilters() {
  return useQuery({
    queryKey: queryKeys.filters(),
    queryFn: ({ signal }) => getJson('/filters', filtersSchema, { signal }),
    staleTime: Infinity,
  })
}
