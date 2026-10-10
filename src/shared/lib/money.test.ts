import { describe, expect, it } from 'vitest'

import { roundToCents, toCents } from './money'

describe('toCents', () => {
  it.each([
    [245.8, 24580],
    [1250.3, 125030],
    [4150.8, 415080],
    [0, 0],
    [-199, -19900],
  ])('converts %d rand to %d cents', (amount, cents) => {
    expect(toCents(amount)).toBe(cents)
  })

  it('is exact where floating point multiplication is not (0.29 * 100 is 28.999...)', () => {
    expect(toCents(0.29)).toBe(29)
  })

  it.each([
    ['more than two decimals', 1.234],
    ['not a number', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
    ['too large to be exact in cents', Number.MAX_SAFE_INTEGER],
  ])('rejects an amount that is %s', (_reason, amount) => {
    expect(toCents(amount)).toBeUndefined()
  })
})

describe('roundToCents', () => {
  it('rounds an average with more than two decimals to the nearest cent', () => {
    expect(roundToCents(90.4415)).toBe(9044)
    expect(roundToCents(109.2347)).toBe(10923)
  })

  it('rejects values that are not finite', () => {
    expect(roundToCents(Number.NaN)).toBeUndefined()
    expect(roundToCents(Number.NEGATIVE_INFINITY)).toBeUndefined()
  })
})
