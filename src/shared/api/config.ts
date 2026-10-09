/** All API paths start here, on the app's own origin (CSP connect-src 'self'). */
export const API_BASE_PATH = '/api'

/**
 * The signed-in customer. One mocked customer for now (A6); in production this
 * comes from the authenticated session, and this is the only line to change.
 */
export const CUSTOMER_ID = '12345'

/** Requests are abandoned after this long (NFR R3). */
export const REQUEST_TIMEOUT_MS = 10_000
