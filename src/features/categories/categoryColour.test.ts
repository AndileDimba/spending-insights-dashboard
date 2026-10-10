import { describe, expect, it } from 'vitest'

import { categoryColour, FALLBACK_CATEGORY_COLOUR } from './categoryColour'

describe('categoryColour (A15, threat T2)', () => {
  it('uses the colour the API sent, once the schema has validated it', () => {
    expect(categoryColour('#FF6B6B')).toBe('#FF6B6B')
  })

  it('uses a design token colour when the API colour was invalid', () => {
    // The schema turns anything but #RRGGBB into null.
    expect(categoryColour(null)).toBe(FALLBACK_CATEGORY_COLOUR)
    expect(FALLBACK_CATEGORY_COLOUR).toMatch(/^#[0-9a-f]{6}$/i)
  })
})
