import { vi } from 'vitest'

/**
 * Fixes "now" for tests that depend on the date, such as periods and days
 * remaining. Only Date is faked: timers stay real so user-event and
 * findBy queries keep working. setup.ts restores the real clock after each test.
 */
export function fixClock(isoDateTime: string): void {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(isoDateTime))
}
