import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { server } from '@/mocks/node'
import { logger } from '@/shared/lib/logger'
import { specExample } from '@/test/api-spec'

import { ApiError, getJson, retryDelay, shouldRetry } from './client'
import { profileSchema } from './schemas'

// Scenarios of #12. NFR and decision IDs refer to the discovery docs and
// docs/api-assumptions.md.

const PROFILE_URL = '*/api/customers/12345/profile'
const profile = () => specExample(profileSchema, 1)

function respondWith(resolver: Parameters<typeof http.get>[1]) {
  server.use(http.get(PROFILE_URL, resolver))
}

async function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => {
      throw new Error('Expected the request to fail')
    },
    (error: unknown) => error,
  )
}

describe('getJson', () => {
  it('returns the parsed, typed data for a valid response', async () => {
    respondWith(() => HttpResponse.json(profile()))

    const data = await getJson('/profile', profileSchema)

    expect(data.name).toBe('John Doe')
    expect(data.totalSpent).toBe(1542050)
  })

  it('requests the customer path on the app origin, sending only parameters that are set', async () => {
    let requested = ''
    respondWith(({ request }) => {
      requested = request.url
      return HttpResponse.json(profile())
    })

    await getJson('/profile', profileSchema, { params: { period: '7d', category: undefined } })

    expect(requested).toBe(`${location.origin}/api/customers/12345/profile?period=7d`)
  })

  it('asks for JSON', async () => {
    let accept: string | null = null
    respondWith(({ request }) => {
      accept = request.headers.get('accept')
      return HttpResponse.json(profile())
    })

    await getJson('/profile', profileSchema)

    expect(accept).toBe('application/json')
  })

  it('names every invalid field by its path, once each', async () => {
    const log = vi.spyOn(logger, 'error')
    const schema = z.object({ card: z.object({ last4: z.string() }), limit: z.number() })
    server.use(
      http.get('*/api/customers/12345/card', () =>
        HttpResponse.json({ card: { last4: 1234 }, limit: 'high' }),
      ),
    )

    await failureOf(getJson('/card', schema))

    expect(log).toHaveBeenCalledWith('api.validation_failed', {
      endpoint: '/card',
      fields: 'card.last4, limit',
    })
  })

  it('stops its timeout and its cancel listener once the request settles', async () => {
    const stopTimer = vi.spyOn(globalThis, 'clearTimeout')
    const controller = new AbortController()
    const stopListening = vi.spyOn(controller.signal, 'removeEventListener')
    respondWith(() => HttpResponse.json(profile()))

    await getJson('/profile', profileSchema, { signal: controller.signal })

    expect(stopTimer).toHaveBeenCalled()
    expect(stopListening).toHaveBeenCalledWith('abort', expect.any(Function))
  })

  it('turns an HTTP error into an ApiError with the status and a safe message (A5)', async () => {
    respondWith(() =>
      HttpResponse.json(
        {
          title: 'Internal Server Error',
          status: 500,
          detail: 'NullReferenceException at Db.Query',
        },
        { status: 500 },
      ),
    )

    const error = await failureOf(getJson('/profile', profileSchema))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'http', status: 500, endpoint: '/profile' })
    expect((error as ApiError).message).not.toContain('NullReference')
  })

  it('turns an invalid payload into a validation error, logging field paths but not values', async () => {
    const log = vi.spyOn(logger, 'error')
    respondWith(() => HttpResponse.json({ ...profile(), totalSpent: 'R15420.50' }))

    const error = await failureOf(getJson('/profile', profileSchema))

    expect(error).toMatchObject({ kind: 'validation', endpoint: '/profile' })
    expect(log).toHaveBeenCalledWith(
      'api.validation_failed',
      expect.objectContaining({ fields: 'totalSpent' }),
    )
    const logged = JSON.stringify(log.mock.calls)
    expect(logged).not.toContain('John Doe')
    expect(logged).not.toContain('15420')
    expect(logged).not.toContain('12345')
  })

  it('treats a body that is not JSON as invalid data', async () => {
    const log = vi.spyOn(logger, 'error')
    respondWith(() => new HttpResponse('<html>Gateway timeout</html>', { status: 200 }))

    await expect(getJson('/profile', profileSchema)).rejects.toMatchObject({ kind: 'validation' })
    expect(log).toHaveBeenCalledWith('api.validation_failed', {
      endpoint: '/profile',
      fields: '(response is not JSON)',
    })
  })

  it('reports a network failure, logged without a status', async () => {
    const log = vi.spyOn(logger, 'error')
    respondWith(() => HttpResponse.error())

    await expect(getJson('/profile', profileSchema)).rejects.toMatchObject({ kind: 'network' })
    expect(log.mock.calls[0]?.[1]).not.toHaveProperty('status')
  })

  it('abandons a request that takes longer than the timeout (NFR R3)', async () => {
    respondWith(async () => {
      await delay(200)
      return HttpResponse.json(profile())
    })

    await expect(getJson('/profile', profileSchema, { timeoutMs: 20 })).rejects.toMatchObject({
      kind: 'timeout',
    })
  })

  it('lets a caller cancel a superseded request, without treating it as a failure', async () => {
    const log = vi.spyOn(logger, 'error')
    respondWith(async () => {
      await delay(200)
      return HttpResponse.json(profile())
    })
    const controller = new AbortController()

    const request = getJson('/profile', profileSchema, { signal: controller.signal })
    controller.abort()

    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
    expect(log).not.toHaveBeenCalled()
  })

  it('does not send a request whose signal was cancelled before the call', async () => {
    let requested = false
    respondWith(() => {
      requested = true
      return HttpResponse.json(profile())
    })

    const request = getJson('/profile', profileSchema, { signal: AbortSignal.abort() })

    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
    expect(requested).toBe(false)
  })

  it('logs failures with the endpoint, never the customer ID (NFR PR1, O2)', async () => {
    const log = vi.spyOn(logger, 'error')
    respondWith(() => new HttpResponse(null, { status: 503 }))

    await failureOf(getJson('/profile', profileSchema))

    expect(log).toHaveBeenCalledWith('api.request_failed', {
      kind: 'http',
      endpoint: '/profile',
      status: 503,
    })
  })
})

// The errors are built inside each test, not in the tables: a table is
// evaluated when the tests are collected, before the test runs, so the code
// that builds them would not count as tested (Stryker showed this, #24).
describe('retries (NFR R4)', () => {
  const error = (kind: ApiError['kind'], status?: number) => () =>
    new ApiError(kind, '/profile', status)

  it.each([
    ['a network failure', error('network')],
    ['a timeout', error('timeout')],
    ['a 500', error('http', 500)],
    ['a 503', error('http', 503)],
  ])('retries %s at most twice', (_name, failure) => {
    expect(shouldRetry(0, failure())).toBe(true)
    expect(shouldRetry(1, failure())).toBe(true)
    expect(shouldRetry(2, failure())).toBe(false)
  })

  it.each([
    ['a 400', error('http', 400)],
    ['a 404', error('http', 404)],
    ['a 499', error('http', 499)],
    ['invalid data', error('validation')],
    ['an HTTP error without a status', error('http')],
    ['an unexpected error', () => new Error('bug')],
  ])('never retries %s, which a second attempt cannot fix', (_name, failure) => {
    expect(shouldRetry(0, failure())).toBe(false)
  })

  it('backs off exponentially: 1 second, then 2', () => {
    expect([retryDelay(0), retryDelay(1)]).toEqual([1000, 2000])
  })
})

describe('ApiError', () => {
  it.each([
    ['network', undefined, 'We could not reach the server. Check your connection and try again.'],
    ['timeout', undefined, 'The server took too long to respond. Please try again.'],
    [
      'validation',
      undefined,
      'We received information that could not be shown. Please try again later.',
    ],
    ['http', 500, 'This service is temporarily unavailable. Please try again.'],
    ['http', 503, 'This service is temporarily unavailable. Please try again.'],
    ['http', 404, 'The information you asked for could not be found.'],
    ['http', 499, 'Your request could not be completed.'],
    ['http', 400, 'Your request could not be completed.'],
    ['http', undefined, 'Your request could not be completed.'],
  ] as const)('a %s error with status %s says: %s', (kind, status, message) => {
    expect(new ApiError(kind, '/goals', status).message).toBe(message)
  })

  it('is named, so it can be told apart from other errors', () => {
    expect(new ApiError('network', '/goals').name).toBe('ApiError')
  })
})
