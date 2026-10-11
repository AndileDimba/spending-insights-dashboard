import { FetchInterceptor } from '@mswjs/interceptors/fetch'
import { defineNetwork, InterceptorSource } from 'msw/experimental'

import { createHandlers, type MockScenario } from './handlers'

const SCENARIOS: readonly MockScenario[] = ['normal', 'empty', 'error', 'slow']

/**
 * Starts the mock API in the browser (ADR 0008, ADR 0016). It patches
 * `fetch` in the page itself rather than running in a service worker, which
 * browsers stop when idle: iOS Safari did it while a tester paged through
 * transactions, and the requests then reached the network (#78).
 *
 * Opening any page with ?mock=error, ?mock=empty or ?mock=slow shows that
 * failure state, which is how the demo and the e2e tests reach states a
 * working API rarely produces.
 */
export async function startMockApi(): Promise<void> {
  const requested = new URLSearchParams(window.location.search).get('mock')
  const scenario = SCENARIOS.find((candidate) => candidate === requested) ?? 'normal'

  await removeOldMockWorker()

  defineNetwork({
    sources: [new InterceptorSource({ interceptors: [new FetchInterceptor()] })],
    handlers: createHandlers({ scenario }),
    // Only the API is mocked; every other request, such as the app's own
    // files, goes to the network untouched.
    onUnhandledFrame: 'bypass',
  }).enable()
}

/** Visitors from before #78 still have the old mock service worker registered. */
async function removeOldMockWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(
    registrations
      .filter(({ active }) => active?.scriptURL.endsWith('/mockServiceWorker.js'))
      .map((registration) => registration.unregister()),
  )
}
