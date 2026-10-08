declare const centsBrand: unique symbol

/** An amount of money in integer minor units (cents). See ADR 0013. */
export type Cents = number & { readonly [centsBrand]: true }

// Multiplying a decimal by 100 can land a hair away from the whole number
// (0.29 * 100 is 28.999999999999996), so "has at most two decimals" allows
// for that rounding error instead of comparing exactly.
const TOLERANCE = 1e-6

/** Converts an exact amount with at most two decimals to cents, or undefined if it is not one. */
export function toCents(amount: number): Cents | undefined {
  const scaled = amount * 100
  const cents = Math.round(scaled)
  // Beyond the safe integer range, cents are no longer exact.
  if (!Number.isSafeInteger(cents)) return undefined
  if (Math.abs(scaled - cents) > TOLERANCE) return undefined
  return cents as Cents
}

/** Converts an amount that may have more decimals, such as an average, to the nearest cent. */
export function roundToCents(amount: number): Cents | undefined {
  const cents = Math.round(amount * 100)
  return Number.isSafeInteger(cents) ? (cents as Cents) : undefined
}
