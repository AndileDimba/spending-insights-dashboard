import { useSearchParams } from 'react-router'

import { type SortBy, transactionsParams } from '@/shared/api/params'
import { useFilters } from '@/shared/api/queries'

/** URL parameters this page owns. Others, such as ?mock=, are left alone. */
const FILTER_KEYS = ['category', 'startDate', 'endDate', 'sortBy', 'page'] as const

export type FilterName = 'category' | 'startDate' | 'endDate' | 'sortBy'

export interface TransactionFilterState {
  /** Validated values, ready for the controls and the request. */
  category: string | undefined
  startDate: string | undefined
  endDate: string | undefined
  sortBy: SortBy
  /** The category names /filters knows about, for the category control. */
  categories: readonly string[]
  /** False while a category in the URL waits for /filters to validate it (A13). */
  ready: boolean
  /** Whether any filter or sort order differs from the defaults. */
  active: boolean
  /** The start date is after the end date, so the range is not applied. */
  rangeInverted: boolean
  setFilter: (name: FilterName, value: string) => void
  clear: () => void
}

/**
 * The transactions filters, kept in the URL so a view can be bookmarked and
 * shared (ADR 0007). The URL is untrusted: values go through the API's own
 * parameter builder, and only categories /filters knows are used (A13).
 */
export function useTransactionFilters(): TransactionFilterState {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useFilters()

  const raw = (name: string) => searchParams.get(name) ?? undefined
  const params = transactionsParams({
    category: raw('category'),
    startDate: raw('startDate'),
    endDate: raw('endDate'),
    sortBy: raw('sortBy'),
  })

  const categories = filters.data?.categories.map((category) => category.name) ?? []
  // A category is only used once /filters confirms it exists. If /filters
  // fails, it is dropped: a safe default rather than an unvalidated value.
  const category =
    params.category !== undefined && categories.includes(params.category)
      ? params.category
      : undefined
  const ready = params.category === undefined || !filters.isPending

  const rawStart = raw('startDate')
  const rawEnd = raw('endDate')

  function update(change: (next: URLSearchParams) => void) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      change(next)
      // Any change of filter starts again from the first page.
      next.delete('page')
      return next
    })
  }

  return {
    category,
    startDate: params.startDate,
    endDate: params.endDate,
    sortBy: params.sortBy,
    categories,
    ready,
    active: FILTER_KEYS.some((key) => key !== 'page' && searchParams.has(key)),
    rangeInverted: rawStart !== undefined && rawEnd !== undefined && rawStart > rawEnd,
    setFilter: (name, value) => {
      update((next) => {
        if (value) next.set(name, value)
        else next.delete(name)
      })
    },
    clear: () => {
      update((next) => {
        for (const key of FILTER_KEYS) next.delete(key)
      })
    },
  }
}
