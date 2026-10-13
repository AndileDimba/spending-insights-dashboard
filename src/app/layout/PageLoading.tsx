import { Skeleton } from '@/shared/ui/Skeleton'
import { VisuallyHidden } from '@/shared/ui/VisuallyHidden'

import styles from './Page.module.css'

/**
 * Shown in place of a page while its code loads on the first visit, so the
 * header and navigation appear at once (#25, NFR P4). The heading-sized block
 * keeps the page from jumping when the real heading arrives (NFR P3).
 */
export function PageLoading() {
  return (
    <div className={styles.page} aria-busy="true">
      <VisuallyHidden>Loading the page</VisuallyHidden>
      <Skeleton width="12rem" height="2.4rem" />
      <Skeleton height="10rem" />
    </div>
  )
}
