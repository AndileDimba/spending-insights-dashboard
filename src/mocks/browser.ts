import { setupWorker } from 'msw/browser'

import { createHandlers, type MockScenario } from './handlers'

const SCENARIOS: readonly MockScenario[] = ['normal', 'empty', 'error', 'slow']

/**
 * Starts the mock API in the browser (ADR 0008). Opening any page with
 * ?mock=error, ?mock=empty or ?mock=slow shows that failure state, which is
 * how the demo and the e2e tests reach states a working API rarely produces.
 */
export async function startMockWorker(): Promise<void> {
  const requested = new URLSearchParams(window.location.search).get('mock')
  const scenario = SCENARIOS.find((candidate) => candidate === requested) ?? 'normal'

  await setupWorker(...createHandlers({ scenario })).start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    // Only the API is mocked; every other request, such as the app's own
    // files, goes to the network untouched.
    onUnhandledFrame: 'bypass',
    quiet: true,
  })
}
