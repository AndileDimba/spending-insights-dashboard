import { type QueryClient, useQuery, type UseQueryResult } from '@tanstack/react-query'

import { CUSTOMER_ID } from './config'
import type {
  CategoriesParams,
  categoriesParams,
  SummaryParams,
  summaryParams,
  TransactionsParams,
  transactionsParams,
  TrendsParams,
  trendsParams,
} from './params'
import type {
  CategoryBreakdown,
  Filters,
  Goals,
  Profile,
  SpendingSummary,
  TransactionPage,
  Trends,
} from './schemas'

/**
 * Query keys for every endpoint. Each key includes all of its parameters, so
 * every filter combination is cached on its own (ADR 0007).
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

export function createQueryClient(): QueryClient {
  throw new Error('Not implemented')
}

/** Stub: never fetches. Replaced in the next commit. */
function usePending<T>(): UseQueryResult<T> {
  return useQuery<T>({
    queryKey: ['not-implemented'],
    queryFn: () => new Promise<T>(() => undefined),
    enabled: false,
  })
}

export const useProfile = () => usePending<Profile>()
export const useSpendingSummary = (_input: Parameters<typeof summaryParams>[0]) =>
  usePending<SpendingSummary>()
export const useCategoryBreakdown = (_input: Parameters<typeof categoriesParams>[0]) =>
  usePending<CategoryBreakdown>()
export const useTrends = (_input: Parameters<typeof trendsParams>[0]) => usePending<Trends>()
export const useTransactions = (_input: Parameters<typeof transactionsParams>[0]) =>
  usePending<TransactionPage>()
export const useGoals = () => usePending<Goals>()
export const useFilters = () => usePending<Filters>()
