import type { HttpHandler } from 'msw'

/** How the mock API behaves: normally, with no data, failing, or slowly. */
export type MockScenario = 'normal' | 'empty' | 'error' | 'slow'

export interface MockApiOptions {
  seed?: number
  now?: () => Date
  scenario?: MockScenario
  /** How long the slow scenario waits before answering. */
  slowDelayMs?: number
}

export function createHandlers(_options: MockApiOptions = {}): HttpHandler[] {
  return []
}
