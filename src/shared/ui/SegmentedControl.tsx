import { useId } from 'react'

import styles from './SegmentedControl.module.css'

export interface SegmentedControlProps<T extends string | number> {
  /** The group's accessible name, shown beside the options. */
  label: string
  options: readonly { label: string; value: T }[]
  value: T
  onChange: (value: T) => void
}

/**
 * A choice of one from a few options, shown as pills. Built from native radio
 * buttons, so arrow keys, the selected state and the group name reach
 * assistive technology without custom code.
 */
export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const name = useId()
  const labelId = useId()

  return (
    <div role="radiogroup" aria-labelledby={labelId} className={styles.group}>
      <span id={labelId} className={styles.label}>
        {label}
      </span>
      {options.map((option) => (
        <label key={option.value} className={styles.option}>
          <input
            type="radio"
            name={name}
            value={option.value}
            className={styles.input}
            checked={option.value === value}
            onChange={() => {
              onChange(option.value)
            }}
          />
          <span className={styles.text}>{option.label}</span>
        </label>
      ))}
    </div>
  )
}
