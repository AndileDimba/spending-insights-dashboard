import styles from './Updating.module.css'

/**
 * Says that the figures on screen are about to be replaced. A view keeps its
 * current data while new data loads, so the page does not jump (#77); this
 * makes that visible, so nobody reads the old figures as the new ones (#116).
 * The region around it carries aria-busy for assistive technology.
 */
export function Updating() {
  return <p className={styles.updating}>Updating</p>
}
