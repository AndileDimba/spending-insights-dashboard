import { expect, expectNoAccessibilityViolations, test } from './fixtures'

// #23, journey "an error state and a successful retry, using a mock
// scenario". ?mock=recover fails every request until the client has used its
// automatic retries, so the error state shows and "Try again" works.

test('an error state offers a retry that recovers', async ({ page }) => {
  await page.goto('/?mock=recover')
  const summary = page.getByRole('region', { name: 'Spending summary, last 30 days' })

  const error = summary.getByRole('alert')
  // The client retries twice with a backoff of 1 s and 2 s before giving up.
  await expect(error).toContainText('We could not load your spending summary', {
    timeout: 15_000,
  })
  await expectNoAccessibilityViolations(page)

  await error.getByRole('button', { name: 'Try again' }).click()

  await expect(summary.getByRole('group', { name: 'Total spent' })).toBeVisible()
  await expect(summary.getByRole('alert')).toHaveCount(0)
})

test('an unknown address shows a not found page with a way back', async ({ page }) => {
  await page.goto('/no-such-page')

  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  await expectNoAccessibilityViolations(page)
  await page.getByRole('main').getByRole('link').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()
})
