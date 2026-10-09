import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

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
    respondWith(() => new HttpResponse('<html>Gateway timeout</html>', { status: 200 }))

    await expect(getJson('/profile', profileSchema)).rejects.toMatchObject({ kind: 'validation' })
  })

  it('reports a network failure', async () => {
    respondWith(() => HttpResponse.error())

    await expect(getJson('/profile', profileSchema)).rejects.toMatchObject({ kind: 'network' })
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

describe('retries (NFR R4)', () => {
  const error = (kind: ApiError['kind'], status?: number) => new ApiError(kind, '/profile', status)

  it.each([
    ['a network failure', error('network')],
    ['a timeout', error('timeout')],
    ['a 503', error('http', 503)],
  ])('retries %s at most twice', (_name, failure) => {
    expect(shouldRetry(0, failure)).toBe(true)
    expect(shouldRetry(1, failure)).toBe(true)
    expect(shouldRetry(2, failure)).toBe(false)
  })

  it.each([
    ['a 400', error('http', 400)],
    ['a 404', error('http', 404)],
    ['invalid data', error('validation')],
    ['an unexpected error', new Error('bug')],
  ])('never retries %s, which a second attempt cannot fix', (_name, failure) => {
    expect(shouldRetry(0, failure)).toBe(false)
  })

  it('backs off exponentially: 1 second, then 2', () => {
    expect([retryDelay(0), retryDelay(1)]).toEqual([1000, 2000])
  })
})

describe('ApiError', () => {
  it.each([
    [new ApiError('network', '/goals'), 'We could not reach the server'],
    [new ApiError('timeout', '/goals'), 'took too long'],
    [new ApiError('http', '/goals', 503), 'temporarily unavailable'],
    [new ApiError('http', '/goals', 404), 'could not be found'],
    [new ApiError('validation', '/goals'), 'could not be shown'],
  ])('has a plain-language message: %s', (error, text) => {
    expect(error.message).toContain(text)
  })
})
