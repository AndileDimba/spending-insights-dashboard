import type { Locator, Page } from '@playwright/test'

import { expect, test } from './fixtures'

// #23, journey "the whole dashboard using only the keyboard" (WCAG 2.1.1).

/** Presses Tab until the locator has focus, failing after a sensible number of stops. */
async function tabTo(page: Page, target: Locator, maxStops = 40) {
  for (let stop = 0; stop < maxStops; stop += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  throw new Error(`Tab never reached ${target.toString()}`)
}

test('the dashboard can be used with the keyboard alone', async ({ page, browserName }) => {
  test.skip(
    browserName === 'webkit',
    'WebKit, like Safari by default, skips links on Tab, so the skip link and navigation are unreachable there',
  )
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()

  // Skip link first, then straight to the content.
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()

  // The period is a radio group: Tab reaches the selected one, arrows move.
  await tabTo(page, page.getByRole('radio', { name: 'Last 30 days' }))
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'Last 90 days' })).toBeChecked()
  await expect(page).toHaveURL(/period=90d/)

  // Navigation moves focus to the new page's heading.
  await tabTo(page, page.getByRole('link', { name: 'Transactions' }))
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Transactions' })).toBeFocused()

  // A filter, then the next page.
  await expect(page.getByRole('region', { name: 'Transactions' })).toHaveAttribute(
    'aria-busy',
    'false',
  )
  await tabTo(page, page.getByRole('combobox', { name: 'Sort by' }))
  await page.keyboard.press('ArrowDown')
  await expect(page).toHaveURL(/sortBy=date_asc/)
  await tabTo(page, page.getByRole('button', { name: 'Next page' }))
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/page=2/)
})
