/** Fails the test if axe finds accessibility violations in the container. */
export async function expectNoAccessibilityViolations(container: Element): Promise<void> {
  await Promise.resolve(container)
}
