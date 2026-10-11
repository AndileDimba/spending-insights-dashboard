import { type ReactNode, useEffect } from 'react'

import styles from './Page.module.css'

const PRODUCT_NAME = 'Spending Insights'

export interface PageProps {
  /** The page's h1 and the first part of the document title. */
  title: string
  children?: ReactNode
}

/**
 * A routed page: one h1 and the document title. The heading can take focus
 * (tabIndex -1) because AppLayout moves focus to it after a navigation.
 */
export function Page({ title, children }: PageProps) {
  useEffect(() => {
    document.title = `${title} | ${PRODUCT_NAME}`
  }, [title])

  return (
    <div className={styles.page}>
      <h1 tabIndex={-1} className={styles.title}>
        {title}
      </h1>
      {children}
    </div>
  )
}
