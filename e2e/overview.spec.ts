import type { Page } from '@playwright/test'

import { expect, test } from './fixtures'

// #23, journeys "changing the period updates the URL and every view" and
// "drill down from a category to filtered transactions".

/** en-ZA numbers group thousands with a non-breaking space. */
const normalise = (text: string | null) => (text ?? '').replace(/\s/g, ' ').trim()

async function settled(page: Page, region: string) {
  await expect(page.getByRole('region', { name: region })).toHaveAttribute('aria-busy', 'false')
}

test('changing the period updates the URL and every view that uses it', async ({ page }) => {
  await page.goto('/')
  await settled(page, 'Spending summary, last 30 days')
  await settled(page, 'Spending by category')
  const range = page.getByRole('region', { name: 'Spending by category' }).locator('h2 + p')
  const rangeBefore = normalise(await range.textContent())

  // People tap the pill, which is the radio's label; the radio is invisible.
  await page.locator('label', { hasText: /^Last 7 days$/ }).click()

  await expect(page).toHaveURL(/[?&]period=7d/)
  await settled(page, 'Spending summary, last 7 days')
  await settled(page, 'Spending by category')
  await expect(range).not.toHaveText(rangeBefore)

  // The URL is the state: a reload shows the same period.
  await page.reload()
  await expect(page.getByRole('radio', { name: 'Last 7 days' })).toBeChecked()
  await settled(page, 'Spending summary, last 7 days')
})

test('a category drills down to its transactions for the same dates', async ({ page }) => {
  await page.goto('/')
  await settled(page, 'Spending by category')
  const top = page.getByRole('list', { name: 'Categories by amount' }).getByRole('listitem').first()
  const link = top.getByRole('link')
  const category = normalise(await link.textContent())
  const purchases = Number(
    normalise(await top.getByText(/purchases?$/).textContent()).replace(/\D/g, ''),
  )

  await link.click()

  await expect(page).toHaveURL(/\/transactions\?.*category=/)
  await expect(page.getByRole('heading', { level: 1, name: 'Transactions' })).toBeFocused()
  await expect(page.getByRole('combobox', { name: 'Category' })).toHaveValue(category)
  await settled(page, 'Transactions')
  // Both views come from the same data, so they must agree: the list holds the
  // category's purchases and its refunds, which the category leaves out (A21).
  // A hundred to a page puts every one of them on screen.
  await page.goto(`${page.url()}&pageSize=100`)
  await settled(page, 'Transactions')
  const total = Number(normalise(await page.getByRole('status').textContent()).replace(/\D/g, ''))
  const refunds = await page.getByText('Refund', { exact: true }).count()
  expect(total).toBeLessThanOrEqual(100)
  expect(total - refunds).toBe(purchases)
})
