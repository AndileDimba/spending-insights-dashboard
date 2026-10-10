import { useId } from 'react'

import { useGoals, useProfile } from '@/shared/api/queries'
import type { Goal, GoalStatus } from '@/shared/api/schemas'
import { formatMoney, formatPercent } from '@/shared/lib/format'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Skeleton } from '@/shared/ui/Skeleton'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'

import styles from './SpendingGoals.module.css'

/**
 * Every status has words and an icon as well as a colour (A8, WCAG 1.4.1).
 * A status the contract does not list is shown neutrally, not as an error.
 */
const STATUS: Record<GoalStatus, { label: string; icon: 'check' | 'alert' | 'cross' | 'info' }> = {
  on_track: { label: 'On track', icon: 'check' },
  warning: { label: 'Close to limit', icon: 'alert' },
  exceeded: { label: 'Over budget', icon: 'cross' },
  unknown: { label: 'Status unavailable', icon: 'info' },
}

/** This month's budgets, how much of each is used, and how long is left. */
export function SpendingGoals() {
  const goals = useGoals()
  // Amounts need the profile's currency (A3).
  const profile = useProfile()

  const pending = goals.isPending || profile.isPending
  const failure = goals.error ?? profile.error

  function retry() {
    if (goals.isError) void goals.refetch()
    if (profile.isError) void profile.refetch()
  }

  return (
    <section className={styles.goals} aria-label="Budgets" aria-busy={pending}>
      <h2 className={styles.title}>Budgets</h2>

      {failure ? (
        <ErrorState
          title="We could not load your budgets"
          message={failure.message}
          onRetry={retry}
        />
      ) : goals.isSuccess && profile.isSuccess ? (
        <GoalList goals={goals.data.goals} currency={profile.data.currency} />
      ) : (
        <Loading />
      )}
    </section>
  )
}

function Loading() {
  return (
    <div className={styles.list}>
      <VisuallyHidden>Loading your budgets</VisuallyHidden>
      {[1, 2].map((key) => (
        <div key={key} className={styles.card}>
          <Skeleton width="9rem" height="1.25rem" />
          <Skeleton height="0.75rem" />
          <Skeleton width="12rem" height="0.875rem" />
        </div>
      ))}
    </div>
  )
}

function GoalList({ goals, currency }: { goals: readonly Goal[]; currency: string }) {
  if (goals.length === 0) return <p className={styles.empty}>You have no spending goals yet</p>

  return (
    <ul className={styles.list}>
      {goals.map((goal) => (
        <GoalCard key={goal.id} goal={goal} currency={currency} />
      ))}
    </ul>
  )
}

function GoalCard({ goal, currency }: { goal: Goal; currency: string }) {
  const nameId = useId()
  const status = STATUS[goal.status]

  return (
    <li className={styles.card} aria-label={`${goal.category} budget`}>
      <div className={styles.top}>
        <h3 id={nameId} className={styles.category}>
          {goal.category}
        </h3>
        <span className={styles.status} data-status={goal.status}>
          <StatusIcon icon={status.icon} />
          {status.label}
        </span>
      </div>

      {/* Over budget fills the bar; the text keeps the real percentage. */}
      <progress
        className={styles.bar}
        data-status={goal.status}
        value={Math.min(goal.percentageUsed, 100)}
        max={100}
        aria-label={`${goal.category} budget used`}
      />

      <div className={styles.figures}>
        <span>
          {formatMoney(goal.currentSpent, currency)} of {formatMoney(goal.monthlyBudget, currency)}
        </span>
        <span>{formatPercent(goal.percentageUsed)} used</span>
      </div>
      <p className={styles.days}>
        {goal.daysRemaining === 1 ? '1 day left' : `${String(goal.daysRemaining)} days left`}
      </p>
    </li>
  )
}

function StatusIcon({ icon }: { icon: 'check' | 'alert' | 'cross' | 'info' }) {
  const paths = {
    check: 'M3.5 8.5 6.5 11.5 12.5 4.5',
    alert: 'M8 3.5v5M8 11.5v.5',
    cross: 'M4.5 4.5l7 7M11.5 4.5l-7 7',
    info: 'M8 7.5v4M8 4.5v.5',
  }
  return (
    <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
      <path
        d={paths[icon]}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
