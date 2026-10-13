import { QueryClient } from '@tanstack/react-query'

import { retryDelay, shouldRetry } from './retry'

// Its own module, without the schemas, so the app shell does not load Zod (#25).

/** The app's query client: retries only what can succeed on a second try (NFR R4). */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, retryDelay, staleTime: 60_000 },
    },
  })
}
