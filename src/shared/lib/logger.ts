/**
 * Structured details only: primitive values, never whole objects, so a
 * response body or a customer record cannot end up in a log by accident
 * (NFR O2).
 */
export type LogDetails = Readonly<Record<string, string | number | boolean | undefined>>

/**
 * The one place errors are reported (NFR O1), and the seam where a monitoring
 * service would be connected. Until one is, development builds write to the
 * console and production builds stay quiet.
 */
export const logger = {
  error(event: string, details: LogDetails = {}): void {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console -- the logger is the one place allowed to write to the console
      console.error(`[${event}]`, details)
    }
  },
}
