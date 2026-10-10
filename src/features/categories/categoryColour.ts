/**
 * Used when the API's colour was invalid. A mid grey that reads as "a
 * category" on both themes; it is never the only way to tell categories apart.
 */
export const FALLBACK_CATEGORY_COLOUR = '#8a8f98'

/**
 * The colour to draw a category in. The schema has already turned anything
 * but #RRGGBB into null (A15, threat T2), so a valid value is safe to use.
 * Colours are decoration beside a name, never the only label.
 */
export function categoryColour(colour: string | null): string {
  return colour ?? FALLBACK_CATEGORY_COLOUR
}
