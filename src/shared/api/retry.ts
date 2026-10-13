import { ApiError } from './errors'

export const MAX_RETRIES = 2

/** Retry only failures that a second attempt can fix (NFR R4). */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES || !(error instanceof ApiError)) return false
  if (error.kind === 'http') return (error.status ?? 0) >= 500
  return error.kind === 'network' || error.kind === 'timeout'
}

/** Exponential backoff: 1 s, then 2 s. */
export function retryDelay(attempt: number): number {
  return 1000 * 2 ** attempt
}
