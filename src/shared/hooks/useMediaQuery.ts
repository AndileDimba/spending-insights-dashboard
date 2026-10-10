import { useSyncExternalStore } from 'react'

function mediaQuery(query: string): MediaQueryList | undefined {
  // Missing in jsdom and in very old browsers; treat that as "no match".
  return typeof window.matchMedia === 'function' ? window.matchMedia(query) : undefined
}

/**
 * Whether a CSS media query matches, updating when it changes. Used where a
 * layout is genuinely different, such as a table or a list, so only one of
 * them is ever in the page for assistive technology.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = mediaQuery(query)
      list?.addEventListener('change', onChange)
      return () => {
        list?.removeEventListener('change', onChange)
      }
    },
    () => mediaQuery(query)?.matches ?? false,
  )
}
