import { lazy, Suspense } from 'react'
import { Link } from 'react-router'

import { usePeriodSelection } from '@/features/period'
import { useCategoryBreakdown, useProfile } from '@/shared/api/queries'
import type { CategoryBreakdown as Breakdown } from '@/shared/api/schemas'
import { formatCount, formatMoney, formatPercent, formatShortDate } from '@/shared/lib/format'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'

import styles from './CategoryBreakdown.module.css'
import { categoryColour } from './categoryColour'

// The chart library is large, so it loads on its own after the page (ADR 0011).
const CategoryChart = lazy(() => import('./CategoryChart'))

/** Where the money went in the selected period: a chart, and the same data as a list. */
export function CategoryBreakdown() {
  const { apiInput } = usePeriodSelection()
  const breakdown = useCategoryBreakdown(apiInput)
  // Amounts need the profile's currency (A3).
  const profile = useProfile()

  const pending = breakdown.isPending || profile.isPending
  const failure = breakdown.error ?? profile.error

  function retry() {
    if (breakdown.isError) void breakdown.refetch()
    if (profile.isError) void profile.refetch()
  }

  return (
    <section className={styles.breakdown} aria-label="Spending by category" aria-busy={pending}>
      <div className={styles.heading}>
        <h2 className={styles.title}>Spending by category</h2>
        {breakdown.data && (
          // The range the server answered for, not one computed here (A10).
          <p className={styles.range}>
            {formatShortDate(breakdown.data.dateRange.startDate)} to{' '}
            {formatShortDate(breakdown.data.dateRange.endDate)}
          </p>
        )}
      </div>

      {failure ? (
        <ErrorState
          title="We could not load your categories"
          message={failure.message}
          onRetry={retry}
        />
      ) : breakdown.isSuccess && profile.isSuccess ? (
        <Details breakdown={breakdown.data} currency={profile.data.currency} />
      ) : (
        <Loading />
      )}
    </section>
  )
}

function Loading() {
  return (
    <>
      <VisuallyHidden>Loading your categories</VisuallyHidden>
      <div className={styles.content}>
        <div className={styles.chart}>
          <Skeleton width="12.5rem" height="12.5rem" />
        </div>
        <div className={styles.list}>
          {[1, 2, 3, 4].map((row) => (
            <Skeleton key={row} height="2.75rem" />
          ))}
        </div>
      </div>
    </>
  )
}

function Details({ breakdown, currency }: { breakdown: Breakdown; currency: string }) {
  const { categories, dateRange } = breakdown
  const [largest] = categories

  if (!largest) return <p className={styles.empty}>No spending in this period</p>

  const summary = `Chart of spending by category. ${largest.name} is the largest at ${formatPercent(largest.percentage)}. The list beside it has every category.`

  return (
    <div className={styles.content}>
      <Suspense fallback={<Skeleton width="12.5rem" height="12.5rem" />}>
        <CategoryChart categories={categories} summary={summary} />
      </Suspense>

      {/* Already sorted by amount at the API boundary (A1). */}
      <ol className={styles.list} aria-label="Categories by amount">
        {categories.map((category) => (
          <li key={category.name} className={styles.item}>
            <span
              className={styles.swatch}
              style={{ backgroundColor: categoryColour(category.color) }}
              aria-hidden="true"
            />
            <span className={styles.name}>
              {/* Drill down to the same dates the server answered for (A10). */}
              <Link
                to={{
                  pathname: '/transactions',
                  search: new URLSearchParams({
                    category: category.name,
                    startDate: dateRange.startDate,
                    endDate: dateRange.endDate,
                  }).toString(),
                }}
              >
                {category.name}
              </Link>
              <span className={styles.count}>
                {formatCount(category.transactionCount)}{' '}
                {category.transactionCount === 1 ? 'transaction' : 'transactions'}
              </span>
            </span>
            <span className={styles.figures}>
              <span className={styles.amount}>{formatMoney(category.amount, currency)}</span>
              <span className={styles.percentage}>{formatPercent(category.percentage)}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
