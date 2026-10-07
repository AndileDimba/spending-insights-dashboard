import { describe, expect, it } from 'vitest'

import { fixClock } from './clock'

describe('test clock', () => {
  it('runs tests in UTC, so local-time bugs behave the same on every machine', () => {
    expect(new Date(0).getTimezoneOffset()).toBe(0)
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('UTC')
  })

  it('fixes the current date and time', () => {
    fixClock('2024-09-16T12:00:00Z')

    expect(new Date().toISOString()).toBe('2024-09-16T12:00:00.000Z')
    expect(Date.now()).toBe(Date.parse('2024-09-16T12:00:00Z'))
  })

  it('leaves timers real, so user events and async waits keep working', async () => {
    fixClock('2024-09-16T12:00:00Z')

    await expect(new Promise((resolve) => setTimeout(resolve, 0))).resolves.toBeUndefined()
  })
})
