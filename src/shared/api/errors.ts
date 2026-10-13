// Errors from the API, separate from the client so the app shell can use the
// retry policy without loading the schemas and Zod (#25).

export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'validation'

/** Plain-language messages. Server text is never shown to the customer (A5). */
function messageFor(kind: ApiErrorKind, status: number | undefined): string {
  switch (kind) {
    case 'network':
      return 'We could not reach the server. Check your connection and try again.'
    case 'timeout':
      return 'The server took too long to respond. Please try again.'
    case 'validation':
      return 'We received information that could not be shown. Please try again later.'
    case 'http':
      // Equivalent mutant: the undefined check is for TypeScript; undefined >= 500
      // is false at runtime anyway (#24).
      // Stryker disable next-line ConditionalExpression
      if (status !== undefined && status >= 500) {
        return 'This service is temporarily unavailable. Please try again.'
      }
      return status === 404
        ? 'The information you asked for could not be found.'
        : 'Your request could not be completed.'
  }
}

/** A failed API call, with a message that is safe to show a customer (A5). */
export class ApiError extends Error {
  override readonly name = 'ApiError'
  readonly kind: ApiErrorKind
  /** The endpoint path, without the customer ID, so it is safe to log. */
  readonly endpoint: string
  readonly status: number | undefined

  constructor(kind: ApiErrorKind, endpoint: string, status?: number) {
    super(messageFor(kind, status))
    this.kind = kind
    this.endpoint = endpoint
    this.status = status
  }
}
