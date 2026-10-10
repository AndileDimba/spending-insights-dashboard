import { vi } from 'vitest'

/**
 * jsdom has no matchMedia. This stands one in whose queries all match, or
 * none do, so a test can choose the wide or the narrow layout. Vitest's
 * unstubGlobals setting removes it after each test.
 */
export function stubMediaQueries({ matches }: { matches: boolean }): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }))
}
