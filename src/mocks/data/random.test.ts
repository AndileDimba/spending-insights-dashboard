import { describe, expect, it } from 'vitest'

import { pick, randomInt, seededRandom } from './random'

function take(random: () => number, count: number): number[] {
  return Array.from({ length: count }, () => random())
}

describe('seededRandom', () => {
  it('gives the same sequence for the same seed', () => {
    expect(take(seededRandom(42), 5)).toEqual(take(seededRandom(42), 5))
  })

  it('gives a different sequence for a different seed', () => {
    expect(take(seededRandom(42), 5)).not.toEqual(take(seededRandom(43), 5))
  })

  it('stays within [0, 1) and spreads across the range', () => {
    const values = take(seededRandom(7), 1000)

    expect(Math.min(...values)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...values)).toBeLessThan(1)
    expect(values.filter((value) => value < 0.5).length).toBeGreaterThan(400)
    expect(values.filter((value) => value >= 0.5).length).toBeGreaterThan(400)
  })
})

describe('randomInt', () => {
  it('returns whole numbers between min and max, inclusive, reaching both ends', () => {
    const random = seededRandom(1)
    const values = new Set(Array.from({ length: 500 }, () => randomInt(random, 1, 4)))

    expect([...values].sort()).toEqual([1, 2, 3, 4])
  })
})

describe('pick', () => {
  it('picks every item eventually', () => {
    const random = seededRandom(3)
    const picked = new Set(Array.from({ length: 200 }, () => pick(random, ['a', 'b', 'c'])))

    expect(picked).toEqual(new Set(['a', 'b', 'c']))
  })

  it('refuses an empty list', () => {
    expect(() => pick(seededRandom(1), [])).toThrow('empty')
  })
})
