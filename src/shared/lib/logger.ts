/**
 * Structured details only: primitive values, never whole objects, so a
 * response body or a customer record cannot end up in a log by accident
 * (NFR O2).
 */
export type LogDetails = Readonly<Record<string, string | number | boolean | undefined>>

/** The one place errors are reported (NFR O1). */
export const logger = {
  error(_event: string, _details: LogDetails = {}): void {
    // Implemented in the next commit.
  },
}
