import { z } from 'zod'

import { type Period, periodSchema } from './schemas'

// Builds request parameters from untrusted input, such as URL query values,
// so that only values the contract allows are ever sent. Invalid values fall
// back to the contract's defaults instead of failing (A2, A9, threat T4).

export const SORT_ORDERS = ['date_desc', 'date_asc', 'amount_desc', 'amount_asc'] as const
export type SortBy = (typeof SORT_ORDERS)[number]

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

const period = periodSchema.catch('30d')
const sortBy = z.enum(SORT_ORDERS).catch('date_desc')
const date = z.iso.date().optional().catch(undefined)
const category = z.string().trim().min(1).max(100).optional().catch(undefined)

/** Numbers arrive from the URL as strings. An empty string is "not set", not zero. */
function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim() !== '') return Number(value)
  return Number.NaN
}

/** A whole number clamped to [min, max]. Anything that is not a whole number gives the fallback. */
function wholeNumber(value: unknown, min: number, max: number, fallback: number): number {
  const number = toNumber(value)
  if (!Number.isInteger(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

/** Both dates, if both are valid and the range does not end before it starts. */
function dateRange(startInput: unknown, endInput: unknown) {
  const startDate = date.parse(startInput)
  const endDate = date.parse(endInput)
  const inverted = startDate !== undefined && endDate !== undefined && startDate > endDate
  return inverted ? {} : { startDate, endDate }
}

export function summaryParams(input: Untrusted<SummaryParams>): SummaryParams {
  return { period: period.parse(input.period) }
}

/** A custom date range wins over the period, but only when both dates are valid (A2). */
export function categoriesParams(
  input: Untrusted<{ period: Period; startDate: string; endDate: string }>,
): CategoriesParams {
  const { startDate, endDate } = dateRange(input.startDate, input.endDate)
  if (startDate !== undefined && endDate !== undefined) return { startDate, endDate }
  return { period: period.parse(input.period) }
}

export function trendsParams(input: Untrusted<TrendsParams>): TrendsParams {
  return { months: wholeNumber(input.months, 1, 24, 12) }
}

export function transactionsParams(input: Untrusted<TransactionsParams>): TransactionsParams {
  const { startDate, endDate } = dateRange(input.startDate, input.endDate)
  const categoryName = category.parse(input.category)
  return {
    limit: wholeNumber(input.limit, 1, 100, 20),
    offset: wholeNumber(input.offset, 0, Number.MAX_SAFE_INTEGER, 0),
    sortBy: sortBy.parse(input.sortBy),
    // Optional parameters are left out entirely rather than sent empty.
    ...(categoryName !== undefined && { category: categoryName }),
    ...(startDate !== undefined && { startDate }),
    ...(endDate !== undefined && { endDate }),
  }
}

/** Encodes parameters as a query string, leaving out any that are not set. */
export function toSearchParams(
  params: Readonly<Record<string, string | number | undefined>>,
): URLSearchParams {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.append(key, String(value))
  }
  return query
}
