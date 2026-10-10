import type { ReactNode } from 'react'

import styles from './VisuallyHidden.module.css'

/** Text for screen readers only, such as a loading message behind a skeleton. */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={styles.hidden}>{children}</span>
}
