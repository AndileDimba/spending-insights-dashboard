import { lazy, Suspense } from 'react'
import { useSearchParams } from 'react-router'

import { trendsParams } from '@/shared/api/params'
import { useProfile, useTrends } from '@/shared/api/queries'
import type { Trends } from '@/shared/api/schemas'
import { todayInSouthAfrica } from '@/shared/lib/dates'
import { formatCount, formatMoney, formatMonth } from '@/shared/lib/format'
import { ErrorState } from '@/shared/ui/ErrorState'
import { SegmentedControl } from '@/shared/ui/SegmentedControl'
import { Skeleton } from '@/shared/ui/Skeleton'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'

import styles from './MonthlyTrends.module.css'

// The chart library is large, so it loads on its own after the page (ADR 0011).
const TrendsChart = lazy(() => import('./TrendsChart'))

const RANGES = [
  { label: '6 months', value: 6 },
  { label: '12 months', value: 12 },
  { label: '24 months', value: 24 },
] as const

/** Spending month by month, as a chart and as a table. */
export function MonthlyTrends() {
  const [searchParams, setSearchParams] = useSearchParams()
  // The URL is untrusted: the API's own builder clamps months to 1 to 24 (A9).
  const { months } = trendsParams({ months: searchParams.get('months') })
  const trends = useTrends({ months })
  // Amounts need the profile's currency (A3).
  const profile = useProfile()

  const pending = trends.isPending || profile.isPending
  const failure = trends.error ?? profile.error

  function retry() {
    if (trends.isError) void trends.refetch()
    if (profile.isError) void profile.refetch()
  }

  function chooseRange(value: number) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('months', String(value))
      return next
    })
  }

  return (
    <section className={styles.trends} aria-label="Monthly spending" aria-busy={pending}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Monthly spending</h2>
        <SegmentedControl label="Range" options={RANGES} value={months} onChange={chooseRange} />
      </div>

      {failure ? (
        <ErrorState
          title="We could not load your monthly spending"
          message={failure.message}
          onRetry={retry}
        />
      ) : trends.isSuccess && profile.isSuccess ? (
        <Details trends={trends.data} requested={months} currency={profile.data.currency} />
      ) : (
        <Loading />
      )}
    </section>
  )
}

function Loading() {
  return (
    <div className={styles.card}>
      <VisuallyHidden>Loading your monthly spending</VisuallyHidden>
      <Skeleton height="13.75rem" />
    </div>
  )
}

interface DetailsProps {
  trends: Trends
  requested: number
  currency: string
}

function Details({ trends: { trends }, requested, currency }: DetailsProps) {
  const first = trends[0]
  const last = trends.at(-1)
  if (!first || !last) return <p className={styles.empty}>No spending history yet</p>

  // The current month is incomplete, so it is labelled as such (A4).
  const currentMonth = todayInSouthAfrica().slice(0, 7)
  const monthName = (month: string) =>
    month === currentMonth ? `${formatMonth(month)} (so far)` : formatMonth(month)
  const highest = trends.reduce((top, trend) => (trend.totalSpent > top.totalSpent ? trend : top))
  const summary = `Chart of monthly spending from ${formatMonth(first.month)} to ${formatMonth(last.month)}. The highest month is ${formatMonth(highest.month)} at ${formatMoney(highest.totalSpent, currency)}. Show as table lists every month.`

  return (
    <div className={styles.card}>
      {/* Months missing from the response are not filled in with zeros (A4). */}
      {trends.length < requested && (
        <p className={styles.partial}>
          Showing {trends.length} of {requested} months
        </p>
      )}

      <Suspense fallback={<Skeleton height="13.75rem" />}>
        <TrendsChart trends={trends} currency={currency} summary={summary} />
      </Suspense>

      <details className={styles.details}>
        <summary>Show as table</summary>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <caption className={styles.caption}>Monthly spending</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">Total spent</th>
                <th scope="col">Transactions</th>
                <th scope="col">Average transaction</th>
              </tr>
            </thead>
            <tbody>
              {trends.map((trend) => (
                <tr key={trend.month}>
                  <th scope="row">{monthName(trend.month)}</th>
                  <td>{formatMoney(trend.totalSpent, currency)}</td>
                  <td>{formatCount(trend.transactionCount)}</td>
                  <td>{formatMoney(trend.averageTransaction, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
