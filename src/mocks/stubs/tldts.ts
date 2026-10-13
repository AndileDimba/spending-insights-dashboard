/**
 * Stands in for tldts in demo builds (#25). MSW's cookie store uses
 * tough-cookie, which asks tldts for a host's registrable domain using a
 * public suffix list of about 250 KB, the largest part of the mock API. The
 * mock API sets and reads no cookies, so the host itself is a safe answer:
 * a cookie would only ever match its exact host, which is stricter than a
 * browser, never looser.
 */
export function getDomain(hostname: string): string {
  return hostname
}
