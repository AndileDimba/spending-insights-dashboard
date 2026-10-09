/** A deterministic source of random numbers in [0, 1). Same seed, same sequence. */
export type Random = () => number

/**
 * mulberry32: a small, well-known 32-bit generator. Not for security, which
 * mock data does not need, but fast and repeatable, so tests stay stable.
 */
export function seededRandom(seed: number): Random {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A whole number between min and max, inclusive. */
export function randomInt(random: Random, min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1))
}

/** One item, chosen uniformly. */
export function pick<T>(random: Random, items: readonly T[]): T {
  const item = items[Math.floor(random() * items.length)]
  if (item === undefined) throw new Error('Cannot pick from an empty list')
  return item
}
