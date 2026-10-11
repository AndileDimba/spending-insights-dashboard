import { AxeBuilder } from '@axe-core/playwright'
import { expect, type Page, test as base } from '@playwright/test'

/**
 * The test every journey uses. It fails the test on anything a user would
 * not see but that still means something is wrong: an uncaught error, a
 * console error, or a Content Security Policy violation (threat model,
 * "Security headers").
 */
export const test = base.extend<{ problems: string[] }>({
  problems: [
    async ({ page }, use) => {
      const problems: string[] = []
      page.on('pageerror', (error) => problems.push(`Uncaught: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() === 'error') problems.push(`Console error: ${message.text()}`)
      })
      await page.exposeFunction(
        'reportCspViolation',
        (directive: string, uri: string, source: string) => {
          problems.push(`CSP violation: ${directive} blocked ${uri} in ${source}`)
        },
      )
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (event) => {
          const report = (window as unknown as Record<string, (...args: string[]) => void>)
            .reportCspViolation
          report?.(
            event.effectiveDirective,
            event.blockedURI,
            `${event.sourceFile}:${String(event.lineNumber)}:${String(event.columnNumber)}`,
          )
        })
      })

      await use(problems)

      expect(problems, 'errors or CSP violations during the test').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

/** Fails on any axe violation of WCAG 2.2 A or AA. */
export async function expectNoAccessibilityViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  expect(
    violations.map(({ id, help, nodes }) => `${id}: ${help} (${String(nodes.length)})`),
  ).toEqual([])
}

/** True when the page is wider than the viewport, so it scrolls sideways. */
export function scrollsSideways(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )
}
