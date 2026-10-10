import { type SubmitEvent, useId, useState } from 'react'

import { useFilters } from '@/shared/api/queries'
import type { Period } from '@/shared/api/schemas'
import { todayInSouthAfrica } from '@/shared/lib/dates'

import styles from './PeriodSelector.module.css'
import { usePeriodSelection } from './usePeriodSelection'

/** The presets in the contract, used until /filters answers, or if it fails. */
const DOCUMENTED_PRESETS: readonly { label: string; value: Period }[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last year', value: '1y' },
]

/**
 * Chooses the period the dashboard shows. Native radio buttons give arrow-key
 * movement and the selected state to assistive technology without custom code.
 */
export function PeriodSelector() {
  const { selection, selectPeriod, applyCustomRange } = usePeriodSelection()
  const { data: filters } = useFilters()
  // Choosing "Custom range" opens the form; the URL only changes on Apply.
  const [customChosen, setCustomChosen] = useState(false)
  const name = useId()
  const labelId = useId()

  const presets = filters?.dateRangePresets.length ? filters.dateRangePresets : DOCUMENTED_PRESETS
  const showCustom = selection.kind === 'custom' || customChosen

  return (
    <div className={styles.selector}>
      <div role="radiogroup" aria-labelledby={labelId} className={styles.group}>
        <span id={labelId} className={styles.label}>
          Period
        </span>
        {presets.map(({ label, value }) => (
          <label key={value} className={styles.option}>
            <input
              type="radio"
              name={name}
              value={value}
              className={styles.input}
              checked={!showCustom && selection.period === value}
              onChange={() => {
                setCustomChosen(false)
                selectPeriod(value)
              }}
            />
            <span className={styles.text}>{label}</span>
          </label>
        ))}
        <label className={styles.option}>
          <input
            type="radio"
            name={name}
            value="custom"
            className={styles.input}
            checked={showCustom}
            onChange={() => {
              setCustomChosen(true)
            }}
          />
          <span className={styles.text}>Custom range</span>
        </label>
      </div>

      {showCustom && (
        <CustomRangeForm
          // A new range from the URL (for example after Back) resets the form.
          key={selection.kind === 'custom' ? `${selection.startDate}/${selection.endDate}` : 'new'}
          initial={selection.kind === 'custom' ? selection : undefined}
          onApply={applyCustomRange}
        />
      )}
    </div>
  )
}

interface CustomRangeFormProps {
  initial: { startDate: string; endDate: string } | undefined
  onApply: (startDate: string, endDate: string) => void
}

function CustomRangeForm({ initial, onApply }: CustomRangeFormProps) {
  const [from, setFrom] = useState(initial?.startDate ?? '')
  const [to, setTo] = useState(initial?.endDate ?? '')
  const [error, setError] = useState<string | null>(null)
  const errorId = useId()
  const today = todayInSouthAfrica()

  function validate(): string | null {
    if (!from || !to) return 'Choose both a start and an end date.'
    if (from > to) return 'The start date must be on or before the end date.'
    if (to > today) return 'The end date cannot be after today.'
    return null
  }

  function apply(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const problem = validate()
    setError(problem)
    if (problem === null) onApply(from, to)
  }

  const invalid = error !== null

  return (
    <form className={styles.custom} onSubmit={apply} noValidate>
      <label className={styles.field}>
        <span>From</span>
        <input
          type="date"
          value={from}
          max={today}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(event) => {
            setFrom(event.target.value)
          }}
        />
      </label>
      <label className={styles.field}>
        <span>To</span>
        <input
          type="date"
          value={to}
          max={today}
          aria-invalid={invalid}
          aria-describedby={invalid ? errorId : undefined}
          onChange={(event) => {
            setTo(event.target.value)
          }}
        />
      </label>
      <button type="submit" className={styles.apply}>
        Apply
      </button>
      {invalid && (
        <p id={errorId} role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </form>
  )
}
