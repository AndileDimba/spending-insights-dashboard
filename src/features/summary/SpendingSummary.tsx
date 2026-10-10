import { type ReactNode, useId } from 'react'

import { periodLabel, usePeriodSelection } from '@/features/period'
import { useProfile, useSpendingSummary } from '@/shared/api/queries'
import type { Profile, SpendingSummary as Summary } from '@/shared/api/schemas'
import { formatCount, formatMoney, formatPercent } from '@/shared/lib/format'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'

import styles from './SpendingSummary.module.css'

/** Spending more is a caution and spending less is good; a count is neutral. */
type Tone = 'caution' | 'good' | 'neutral'

interface Change {
  text: string
  direction: 'up' | 'down' | null
  tone: Tone
}

/** A change from the previous period, in words; the arrow and colour only repeat it. */
function describeChange(
  points: number | null,
  more: string,
  less: string,
  toneWhenUp: Tone,
): Change {
  if (points === null) {
    return { text: 'Nothing to compare with the previous period', direction: null, tone: 'neutral' }
  }
  if (points === 0) {
    return { text: 'No change from the previous period', direction: null, tone: 'neutral' }
  }
  const up = points > 0
  const toneWhenDown: Tone = toneWhenUp === 'caution' ? 'good' : 'neutral'
  return {
    text: `${formatPercent(Math.abs(points))} ${up ? more : less} than the previous period`,
    direction: up ? 'up' : 'down',
    tone: up ? toneWhenUp : toneWhenDown,
  }
}

/** Total spent, transactions, average and top category for the selected period. */
export function SpendingSummary() {
  const { selection } = usePeriodSelection()
  // The summary endpoint takes no date range, so a custom range keeps it on
  // the default period, with a note saying so (A20).
  const period = selection.kind === 'preset' ? selection.period : '30d'
  const label = periodLabel(period)
  const summary = useSpendingSummary({ period })
  // Amounts need the profile's currency, so the cards wait for it (A3).
  const profile = useProfile()

  const pending = summary.isPending || profile.isPending
  const failure = summary.error ?? profile.error

  function retry() {
    if (summary.isError) void summary.refetch()
    if (profile.isError) void profile.refetch()
  }

  return (
    <section
      className={styles.summary}
      aria-label={`Spending summary, ${label.toLowerCase()}`}
      aria-busy={pending}
    >
      <div className={styles.heading}>
        <h2 className={styles.title}>Spending summary</h2>
        <p className={styles.period}>{label}</p>
      </div>

      {selection.kind === 'custom' && (
        <p className={styles.note}>
          These totals are for the last 30 days. Your custom range applies to categories and
          transactions.
        </p>
      )}

      {failure ? (
        <ErrorState
          title="We could not load your spending summary"
          message={failure.message}
          onRetry={retry}
        />
      ) : summary.isSuccess && profile.isSuccess ? (
        <Cards summary={summary.data} currency={profile.data.currency} />
      ) : (
        <Loading />
      )}
    </section>
  )
}

function Loading() {
  return (
    <>
      <VisuallyHidden>Loading your spending summary</VisuallyHidden>
      <div className={styles.cards}>
        {['total', 'count', 'average', 'top'].map((key) => (
          <div key={key} className={styles.card}>
            <Skeleton width="6rem" height="0.875rem" />
            <Skeleton width="8rem" height="1.75rem" />
            <Skeleton width="10rem" height="0.875rem" />
          </div>
        ))}
      </div>
    </>
  )
}

function Cards({ summary, currency }: { summary: Summary; currency: Profile['currency'] }) {
  if (summary.transactionCount === 0) {
    return <p className={styles.empty}>No spending in this period</p>
  }

  const { spentChange, transactionChange } = summary.comparedToPrevious
  return (
    <div className={styles.cards}>
      <Card
        label="Total spent"
        value={formatMoney(summary.totalSpent, currency)}
        change={describeChange(spentChange, 'more', 'less', 'caution')}
      />
      <Card
        label="Transactions"
        value={formatCount(summary.transactionCount)}
        change={describeChange(transactionChange, 'more', 'fewer', 'neutral')}
      />
      <Card label="Average transaction" value={formatMoney(summary.averageTransaction, currency)} />
      <Card label="Top category" value={summary.topCategory ?? 'None'} />
    </div>
  )
}

interface CardProps {
  label: string
  value: ReactNode
  change?: Change
}

function Card({ label, value, change }: CardProps) {
  const labelId = useId()
  return (
    <div role="group" aria-labelledby={labelId} className={styles.card}>
      <p id={labelId} className={styles.label}>
        {label}
      </p>
      <p className={styles.value}>{value}</p>
      {change && (
        <p className={styles.change} data-tone={change.tone}>
          {change.direction && <Arrow direction={change.direction} />}
          <span>{change.text}</span>
        </p>
      )}
    </div>
  )
}

function Arrow({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg className={styles.arrow} data-direction={direction} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 3 13 9H9.5v4h-3V9H3z" fill="currentColor" />
    </svg>
  )
}
