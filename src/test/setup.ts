import '@testing-library/jest-dom/vitest'

// Testing Library only cleans up automatically when the runner exposes a
// global afterEach. Vitest globals are off (explicit imports read better),
// so cleanup is registered by hand below.
// eslint-disable-next-line testing-library/no-manual-cleanup -- see above
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'

import { server } from '@/mocks/node'

const unhandledRequests: string[] = []

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
  // 'error' alone only rejects the fetch, which code under test might catch.
  // Recording the request lets afterEach fail the test regardless.
  server.events.on('request:unhandled', ({ request }) => {
    unhandledRequests.push(`${request.method} ${request.url}`)
  })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  vi.useRealTimers()

  const unexpected = unhandledRequests.splice(0)
  if (unexpected.length > 0) {
    throw new Error(
      `Test made network requests with no handler. Add one with server.use():\n${unexpected.join('\n')}`,
    )
  }
})

afterAll(() => {
  server.close()
})
