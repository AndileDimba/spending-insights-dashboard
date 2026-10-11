import { type ReactNode, useEffect, useRef, useState } from 'react'
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
 *
 * Focus moves once, when the page mounts. A change to the query string, such
 * as a filter or the trends range, is the same page, so focus stays on the
 * control that made it and the page does not scroll (#77).
 */
export function Page({ title, children }: PageProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const { key } = useLocation()
  // 'default' is the key of the history entry the app was opened on.
  const [arrivedByNavigation] = useState(() => key !== 'default')

  useEffect(() => {
    document.title = `${title} | ${PRODUCT_NAME}`
  }, [title])

  useEffect(() => {
    if (arrivedByNavigation) heading.current?.focus()
  }, [arrivedByNavigation])

  return (
    <div className={styles.page}>
      <h1 ref={heading} tabIndex={-1} className={styles.title}>
        {title}
      </h1>
      {children}
    </div>
  )
}
