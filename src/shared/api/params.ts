import type { Period } from './schemas'

// Builds request parameters from untrusted input, such as URL query values,
// so that only values the contract allows are ever sent (A2, A9, threat T4).

export type SortBy = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

/** Values as they arrive from the URL or a form: anything, until parsed. */
type Untrusted<T> = Partial<Record<keyof T, unknown>>

export interface SummaryParams {
  period: Period
}

export type CategoriesParams = { period: Period } | { startDate: string; endDate: string }

export interface TrendsParams {
  months: number
}

export interface TransactionsParams {
  limit: number
  offset: number
  sortBy: SortBy
  category?: string
  startDate?: string
  endDate?: string
}

export function summaryParams(_input: Untrusted<SummaryParams>): SummaryParams {
  throw new Error('Not implemented')
}

export function categoriesParams(
  _input: Untrusted<{ period: Period; startDate: string; endDate: string }>,
): CategoriesParams {
  throw new Error('Not implemented')
}

export function trendsParams(_input: Untrusted<TrendsParams>): TrendsParams {
  throw new Error('Not implemented')
}

export function transactionsParams(_input: Untrusted<TransactionsParams>): TransactionsParams {
  throw new Error('Not implemented')
}

/** Encodes parameters as a query string, leaving out any that are not set. */
export function toSearchParams(
  _params: Readonly<Record<string, string | number | undefined>>,
): URLSearchParams {
  throw new Error('Not implemented')
}
