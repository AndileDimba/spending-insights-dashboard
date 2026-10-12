import { expect, test } from '@playwright/test'

// Canary for #103. The newer WebKit checks the internal styles of every
// <select> against the page's CSP and reports a violation, with no app code
// involved. e2e/fixtures.ts ignores that one report in WebKit. When this test
// fails, WebKit has fixed the bug: delete this file and the exception.
test('WebKit still reports a CSP violation for a bare select', async ({ page, browserName }) => {
  test.skip(browserName !== 'webkit', 'Only WebKit has the bug')
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.setContent(
    `<!doctype html><meta http-equiv="Content-Security-Policy" content="style-src 'self'"><p>Blank</p>`,
  )

  await page.evaluate(() => {
    document.body.append(document.createElement('select'))
  })

  await expect.poll(() => errors.length).toBeGreaterThan(0)
  expect(errors[0]).toContain("'unsafe-inline' does not appear in the style-src directive")
})
