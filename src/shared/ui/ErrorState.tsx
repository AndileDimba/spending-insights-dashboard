import styles from './ErrorState.module.css'

export interface ErrorStateProps {
  title: string
  /** Plain language, never server text (A5). */
  message: string
  onRetry: () => void
}

/** The error state every view shows: what happened, and a way to try again. */
export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className={styles.error}>
      <p className={styles.title}>{title}</p>
      <p>{message}</p>
      <button type="button" className={styles.button} onClick={onRetry}>
        Try again
      </button>
    </div>
  )
}
