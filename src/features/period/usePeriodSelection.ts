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

/** The period the dashboard shows, kept in the URL (ADR 0007). */
export function usePeriodSelection(): PeriodControls {
  return {
    selection: { kind: 'preset', period: '30d' },
    apiInput: { period: '30d' },
    selectPeriod: () => undefined,
    applyCustomRange: () => undefined,
  }
}
