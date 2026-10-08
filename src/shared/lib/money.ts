declare const centsBrand: unique symbol

/** An amount of money in integer minor units (cents). See ADR 0013. */
export type Cents = number & { readonly [centsBrand]: true }

/** Converts an exact amount with at most two decimals to cents, or undefined if it is not one. */
export function toCents(_amount: number): Cents | undefined {
  return undefined
}

/** Converts an amount that may have more decimals, such as an average, to the nearest cent. */
export function roundToCents(_amount: number): Cents | undefined {
  return undefined
}
