import type { z, ZodType } from 'zod'

import { logger } from '@/shared/lib/logger'

import { API_BASE_PATH, CUSTOMER_ID, REQUEST_TIMEOUT_MS } from './config'
import { toSearchParams } from './params'

// The one HTTP client. Components never call fetch; every response is
// validated before it reaches the query cache (ADR 0009).

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'validation'

/** Plain-language messages. Server text is never shown to the customer (A5). */
function messageFor(kind: ApiErrorKind, status: number | undefined): string {
  switch (kind) {
    case 'network':
      return 'We could not reach the server. Check your connection and try again.'
    case 'timeout':
      return 'The server took too long to respond. Please try again.'
    case 'validation':
      return 'We received information that could not be shown. Please try again later.'
    case 'http':
      if (status !== undefined && status >= 500) {
        return 'This service is temporarily unavailable. Please try again.'
      }
      return status === 404
        ? 'The information you asked for could not be found.'
        : 'Your request could not be completed.'
  }
}

/** A failed API call, with a message that is safe to show a customer (A5). */
export class ApiError extends Error {
  override readonly name = 'ApiError'
  readonly kind: ApiErrorKind
  /** The endpoint path, without the customer ID, so it is safe to log. */
  readonly endpoint: string
  readonly status: number | undefined

  constructor(kind: ApiErrorKind, endpoint: string, status?: number) {
    super(messageFor(kind, status))
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

function failure(kind: ApiErrorKind, endpoint: string, status?: number): ApiError {
  logger.error('api.request_failed', { kind, endpoint, ...(status !== undefined && { status }) })
  return new ApiError(kind, endpoint, status)
}

function invalid(endpoint: string, fields: string): ApiError {
  // Field paths only: values may be personal or financial data (NFR O2).
  logger.error('api.validation_failed', { endpoint, fields })
  return new ApiError('validation', endpoint)
}

/**
 * GETs a customer endpoint, such as '/spending/summary', and returns the
 * response parsed by `schema`. Throws an ApiError on failure, or the
 * caller's AbortError when the caller cancels.
 */
export async function getJson<S extends ZodType>(
  path: string,
  schema: S,
  { params = {}, signal, timeoutMs = REQUEST_TIMEOUT_MS }: GetJsonOptions = {},
): Promise<z.output<S>> {
  const url = new URL(`${API_BASE_PATH}/customers/${CUSTOMER_ID}${path}`, window.location.origin)
  url.search = toSearchParams(params).toString()

  // AbortSignal.any is newer than our browser target (NFR B1), so the
  // caller's signal and the timeout are combined by hand.
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  const cancel = () => {
    controller.abort()
  }
  if (signal?.aborted) cancel()
  signal?.addEventListener('abort', cancel, { once: true })

  /** A rejection caused by the caller cancelling is passed on as it is, not reported. */
  const classify = (error: unknown, otherwise: () => ApiError): unknown => {
    if (timedOut) return failure('timeout', path)
    if (signal?.aborted) return error
    return otherwise()
  }

  try {
    let response: Response
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      })
    } catch (error) {
      throw classify(error, () => failure('network', path))
    }

    if (!response.ok) throw failure('http', path, response.status)

    let body: unknown
    try {
      body = await response.json()
    } catch (error) {
      throw classify(error, () => invalid(path, '(response is not JSON)'))
    }

    const result = schema.safeParse(body)
    if (!result.success) {
      const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))]
      throw invalid(path, fields.join(', '))
    }
    return result.data
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', cancel)
  }
}

const MAX_RETRIES = 2

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
