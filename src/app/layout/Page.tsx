import { type ReactNode, useEffect, useRef } from 'react'
import { useLocation } from 'react-router'

import styles from './Page.module.css'

const PRODUCT_NAME = 'Spending Insights'

export interface PageProps {
  /** The page's h1 and the first part of the document title. */
  title: string
  children?: ReactNode
}

/**
 * A routed page: one h1, the document title, and focus management. After a
 * client-side navigation, focus moves to the heading so screen reader and
 * keyboard users start at the new content, as they would after a full page
 * load. On the first load focus is left alone, so the skip link stays the
 * first Tab stop.
 */
export function Page({ title, children }: PageProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const { key } = useLocation()

  useEffect(() => {
    document.title = `${title} | ${PRODUCT_NAME}`
  }, [title])

  useEffect(() => {
    // 'default' is the key of the history entry the app was opened on.
    if (key !== 'default') heading.current?.focus()
  }, [key])

  return (
    <div className={styles.page}>
      <h1 ref={heading} tabIndex={-1} className={styles.title}>
        {title}
      </h1>
      {children}
    </div>
  )
}
