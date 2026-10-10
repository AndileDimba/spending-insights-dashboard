import type { CSSProperties } from 'react'

import styles from './Skeleton.module.css'

export interface SkeletonProps {
  /** Any CSS length. Match the content it stands in for, so nothing jumps (NFR P3). */
  width?: CSSProperties['width']
  height?: CSSProperties['height']
}

/**
 * A placeholder block shown while content loads. Decorative only: the region
 * it sits in carries aria-busy and a visually hidden loading message.
 */
export function Skeleton({ width = '100%', height = '1rem' }: SkeletonProps) {
  return <span className={styles.skeleton} style={{ width, height }} aria-hidden="true" />
}
