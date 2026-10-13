import type { z, ZodType } from 'zod'

import { logger } from '@/shared/lib/logger'

import { API_BASE_PATH, CUSTOMER_ID, REQUEST_TIMEOUT_MS } from './config'
import { ApiError, type ApiErrorKind } from './errors'
import { type QueryParams, toSearchParams } from './params'

// The one HTTP client. Components never call fetch; every response is
// validated before it reaches the query cache (ADR 0009).

export { ApiError, type ApiErrorKind } from './errors'
export { MAX_RETRIES, retryDelay, shouldRetry } from './retry'

export interface GetJsonOptions<P> {
  params?: P
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
export async function getJson<S extends ZodType, P extends QueryParams<P> = Record<string, string>>(
  path: string,
  schema: S,
  { params, signal, timeoutMs = REQUEST_TIMEOUT_MS }: GetJsonOptions<P> = {},
): Promise<z.output<S>> {
  const url = new URL(`${API_BASE_PATH}/customers/${CUSTOMER_ID}${path}`, window.location.origin)
  if (params !== undefined) url.search = toSearchParams(params).toString()

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
  // Equivalent mutants: the listener is removed in `finally` either way.
  // Stryker disable next-line ObjectLiteral,BooleanLiteral
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
