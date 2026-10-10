import { useSearchParams } from 'react-router'

import { type SortBy, transactionsParams } from '@/shared/api/params'
import { useFilters } from '@/shared/api/queries'

/** Filter parameters this page owns. Others, such as ?mock=, are left alone. */
const FILTER_KEYS = ['category', 'startDate', 'endDate', 'sortBy'] as const

export const PAGE_SIZES = [20, 50, 100] as const
export type PageSize = (typeof PAGE_SIZES)[number]

export type FilterName = (typeof FILTER_KEYS)[number]

export interface TransactionFilterState {
  /** Validated values, ready for the controls and the request. */
  category: string | undefined
  startDate: string | undefined
  endDate: string | undefined
  sortBy: SortBy
  /** The page asked for, from 1. */
  page: number
  pageSize: PageSize
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
  goToPage: (page: number) => void
  setPageSize: (size: PageSize) => void
}

/** A whole page number from 1, or 1 for anything else. */
function pageNumber(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

function pageSize(value: string | null): PageSize {
  return PAGE_SIZES.find((size) => String(size) === value) ?? PAGE_SIZES[0]
}

/**
 * The transactions filters and paging, kept in the URL so a view can be
 * bookmarked and shared (ADR 0007). The URL is untrusted: values go through
 * the API's own parameter builder, page and page size are checked against
 * what is allowed, and only categories /filters knows are used (A13).
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
      return next
    })
  }

  return {
    category,
    startDate: params.startDate,
    endDate: params.endDate,
    sortBy: params.sortBy,
    page: pageNumber(searchParams.get('page')),
    pageSize: pageSize(searchParams.get('pageSize')),
    categories,
    ready,
    active: FILTER_KEYS.some((key) => searchParams.has(key)),
    rangeInverted: rawStart !== undefined && rawEnd !== undefined && rawStart > rawEnd,
    setFilter: (name, value) => {
      update((next) => {
        if (value) next.set(name, value)
        else next.delete(name)
        // A different set of results starts again from the first page.
        next.delete('page')
      })
    },
    clear: () => {
      update((next) => {
        for (const key of FILTER_KEYS) next.delete(key)
        next.delete('page')
      })
    },
    goToPage: (page) => {
      update((next) => {
        if (page > 1) next.set('page', String(page))
        else next.delete('page')
      })
    },
    // The page size is a preference, so Clear filters keeps it.
    setPageSize: (size) => {
      update((next) => {
        next.set('pageSize', String(size))
        next.delete('page')
      })
    },
  }
}
