import type { z, ZodType } from 'zod'

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'validation'

/** A failed API call, with a message that is safe to show a customer (A5). */
export class ApiError extends Error {
  override readonly name = 'ApiError'
  readonly kind: ApiErrorKind
  /** The endpoint path, without the customer ID, so it is safe to log. */
  readonly endpoint: string
  readonly status: number | undefined

  constructor(kind: ApiErrorKind, endpoint: string, status?: number) {
    super('Not implemented')
    this.kind = kind
    this.endpoint = endpoint
    this.status = status
  }
}

export interface GetJsonOptions {
  params?: Readonly<Record<string, string | number | undefined>>
  signal?: AbortSignal
  timeoutMs?: number
}

export function getJson<S extends ZodType>(
  _path: string,
  _schema: S,
  _options: GetJsonOptions = {},
): Promise<z.output<S>> {
  return Promise.reject(new Error('Not implemented'))
}

/** Retry only failures that a second attempt can fix (NFR R4). */
export function shouldRetry(_failureCount: number, _error: unknown): boolean {
  return true
}

/** Exponential backoff: 1 s, then 2 s. */
export function retryDelay(_attempt: number): number {
  return 0
}
