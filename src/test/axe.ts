import axe from 'axe-core'

/**
 * Fails the test if axe finds accessibility violations in the container.
 *
 * The 'region' rule is off because component tests render fragments outside
 * the page layout. Landmarks are checked on whole pages in e2e (#23).
 * Colour contrast cannot be computed in jsdom and is also left to e2e.
 */
export async function expectNoAccessibilityViolations(container: Element): Promise<void> {
  const { violations } = await axe.run(container, {
    rules: { region: { enabled: false }, 'color-contrast': { enabled: false } },
  })

  if (violations.length > 0) {
    const report = violations
      .map(
        (violation) =>
          `${violation.id}: ${violation.help} (${String(violation.nodes.length)} element(s))\n  ${violation.helpUrl}`,
      )
      .join('\n')
    throw new Error(`Expected no accessibility violations, found:\n${report}`)
  }
}
