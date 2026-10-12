import { expect, expectNoAccessibilityViolations, scrollsSideways, test } from './fixtures'

// #23, journey "the dashboard loads every section".

const SECTIONS = [
  'Your profile',
  'Spending summary, last 30 days',
  'Spending by category',
  'Budgets',
  'Monthly spending',
]

test('the dashboard loads every section', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()
  for (const name of SECTIONS) {
    const section = page.getByRole('region', { name })
    await expect(section).toBeVisible()
    await expect(section).toHaveAttribute('aria-busy', 'false')
  }
  expect(await scrollsSideways(page)).toBe(false)
  await expectNoAccessibilityViolations(page)
})

// A tester's iPhone: with the trends table open, the page grew wider than the
// screen, and zooming out showed the header ending short of the content.
test('the monthly spending table scrolls inside its card, not the page', async ({ page }) => {
  await page.goto('/?months=24')
  await expect(page.getByRole('region', { name: 'Monthly spending' })).toHaveAttribute(
    'aria-busy',
    'false',
  )

  await page.getByText('Show as table').click()

  await expect(page.getByRole('table', { name: 'Monthly spending' })).toBeVisible()
  expect(await scrollsSideways(page)).toBe(false)
  await expectNoAccessibilityViolations(page)
})
