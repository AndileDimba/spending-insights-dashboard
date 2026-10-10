import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { stubMediaQueries } from '@/test/media'

import { useMediaQuery } from './useMediaQuery'

describe('useMediaQuery', () => {
  it('reports whether the query matches', () => {
    stubMediaQueries({ matches: true })

    const { result } = renderHook(() => useMediaQuery('(min-width: 48rem)'))

    expect(result.current).toBe(true)
  })

  it('updates when the viewport changes', () => {
    let matches = false
    let notify: () => void = () => undefined
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return matches
      },
      addEventListener: (_event: string, listener: () => void) => {
        notify = listener
      },
      removeEventListener: () => undefined,
    }))
    const { result } = renderHook(() => useMediaQuery('(min-width: 48rem)'))
    expect(result.current).toBe(false)

    act(() => {
      matches = true
      notify()
    })

    expect(result.current).toBe(true)
  })

  it('assumes no match where matchMedia does not exist', () => {
    vi.stubGlobal('matchMedia', undefined)

    const { result } = renderHook(() => useMediaQuery('(min-width: 48rem)'))

    expect(result.current).toBe(false)
  })
})
