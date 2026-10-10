import type { Period } from '@/shared/api/schemas'

/** The presets in the contract, used until /filters answers, or if it fails. */
export const DOCUMENTED_PRESETS: readonly { label: string; value: Period }[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
]

/** The words for a period, e.g. '30d' becomes 'Last 30 days'. */
export function periodLabel(period: Period): string {
  return DOCUMENTED_PRESETS.find((preset) => preset.value === period)?.label ?? period
}
