import { useSearchParams } from 'react-router'

import { categoriesParams } from '@/shared/api/params'
import type { Period } from '@/shared/api/schemas'

export type PeriodSelection =
  { kind: 'preset'; period: Period } | { kind: 'custom'; startDate: string; endDate: string }

export interface PeriodControls {
  selection: PeriodSelection
  /** Input for the period-aware query hooks, such as useCategoryBreakdown. */
  apiInput: { period: Period } | { startDate: string; endDate: string }
  selectPeriod: (period: Period) => void
  applyCustomRange: (startDate: string, endDate: string) => void
}

/**
 * The period the dashboard shows, kept in the URL so it can be bookmarked,
 * shared and restored with the back button (ADR 0007).
 */
export function usePeriodSelection(): PeriodControls {
  const [searchParams, setSearchParams] = useSearchParams()

  // The URL is untrusted input: the same builder the API uses validates it, so
  // a bad or tampered value falls back to the default (A2, threat T4).
  const apiInput = categoriesParams({
    period: searchParams.get('period'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
  })
  const selection: PeriodSelection =
    'period' in apiInput ? { kind: 'preset', ...apiInput } : { kind: 'custom', ...apiInput }

  // Other parameters in the URL are kept. Each change adds a history entry,
  // so the back button returns to the previous period.
  function update(change: (next: URLSearchParams) => void) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      change(next)
      return next
    })
  }

  return {
    selection,
    apiInput,
    selectPeriod: (period) => {
      update((next) => {
        next.set('period', period)
        next.delete('startDate')
        next.delete('endDate')
      })
    },
    // A date range replaces the period rather than sitting beside it (A2).
    applyCustomRange: (startDate, endDate) => {
      update((next) => {
        next.delete('period')
        next.set('startDate', startDate)
        next.set('endDate', endDate)
      })
    },
  }
}
