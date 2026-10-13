import { expect, test } from './fixtures'

// #23, "security headers present". The fixture already fails any test that
// causes a CSP violation; this checks the browser receives the headers that
// make one possible (threat model, "Security headers").

const EXPECTED = {
  'content-security-policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'cross-origin-opener-policy': 'same-origin',
}

test('the page arrives with the security headers', async ({ page }) => {
  test.skip(
    !process.env.E2E_BASE_URL,
    'vite preview does not send the headers; set E2E_BASE_URL to a container or the live site',
  )

  const response = await page.goto('/transactions')

  expect(response?.status()).toBe(200)
  const headers = response?.headers() ?? {}
  for (const [name, value] of Object.entries(EXPECTED)) {
    expect(headers[name], name).toBe(value)
  }
})
