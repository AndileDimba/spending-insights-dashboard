import { useId } from 'react'

import type { SortBy } from '@/shared/api/params'
import { todayInSouthAfrica } from '@/shared/lib/dates'

import styles from './TransactionFilters.module.css'
import type { TransactionFilterState } from './useTransactionFilters'

const SORT_OPTIONS: readonly { label: string; value: SortBy }[] = [
  { label: 'Newest first', value: 'date_desc' },
  { label: 'Oldest first', value: 'date_asc' },
  { label: 'Amount, highest first', value: 'amount_desc' },
  { label: 'Amount, lowest first', value: 'amount_asc' },
]

/** Category, date range and sort order for the transactions list. */
export function TransactionFilters({ state }: { state: TransactionFilterState }) {
  const rangeErrorId = useId()
  const today = todayInSouthAfrica()

  return (
    <div className={styles.filters}>
      <label className={styles.field}>
        <span>Category</span>
        <select
          value={state.category ?? ''}
          onChange={(event) => {
            state.setFilter('category', event.target.value)
          }}
        >
          <option value="">All categories</option>
          {state.categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>From</span>
        <input
          type="date"
          value={state.startDate ?? ''}
          max={today}
          aria-invalid={state.rangeInverted}
          aria-describedby={state.rangeInverted ? rangeErrorId : undefined}
          onChange={(event) => {
            state.setFilter('startDate', event.target.value)
          }}
        />
      </label>

      <label className={styles.field}>
        <span>To</span>
        <input
          type="date"
          value={state.endDate ?? ''}
          max={today}
          aria-invalid={state.rangeInverted}
          aria-describedby={state.rangeInverted ? rangeErrorId : undefined}
          onChange={(event) => {
            state.setFilter('endDate', event.target.value)
          }}
        />
      </label>

      <label className={styles.field}>
        <span>Sort by</span>
        <select
          value={state.sortBy}
          onChange={(event) => {
            state.setFilter('sortBy', event.target.value)
          }}
        >
          {SORT_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {state.active && (
        <button type="button" className={styles.clear} onClick={state.clear}>
          Clear filters
        </button>
      )}

      {state.rangeInverted && (
        <p id={rangeErrorId} className={styles.error}>
          The start date must be on or before the end date. The dates are not applied.
        </p>
      )}
    </div>
  )
}
