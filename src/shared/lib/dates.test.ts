import { describe, expect, it } from 'vitest'

import { todayInSouthAfrica } from './dates'

describe('todayInSouthAfrica', () => {
  it('is the South African calendar day, which starts two hours before UTC midnight', () => {
    expect(todayInSouthAfrica(new Date('2024-09-15T21:59:00Z'))).toBe('2024-09-15')
    expect(todayInSouthAfrica(new Date('2024-09-15T22:00:00Z'))).toBe('2024-09-16')
  })
})
