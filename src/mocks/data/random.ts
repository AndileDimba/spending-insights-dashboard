/** A deterministic source of random numbers in [0, 1). Same seed, same sequence. */
export type Random = () => number

export function seededRandom(_seed: number): Random {
  return () => 0
}

/** A whole number between min and max, inclusive. */
export function randomInt(_random: Random, _min: number, _max: number): number {
  return 0
}

/** One item, chosen uniformly. */
export function pick<T>(_random: Random, items: readonly T[]): T {
  const item = items[0]
  if (item === undefined) throw new Error('Cannot pick from an empty list')
  return item
}
