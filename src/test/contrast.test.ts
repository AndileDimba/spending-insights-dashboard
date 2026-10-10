import { describe, expect, it } from 'vitest'

import { contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('matches the WCAG reference values', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5)
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5)
    expect(contrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 2)
  })

  it('does not depend on the order of the colours', () => {
    expect(contrastRatio('#004973', '#FFFFFF')).toBe(contrastRatio('#FFFFFF', '#004973'))
  })
})
