import { expect, test } from './fixtures'

// #75: after going to another page, focus moves to its heading so screen
// readers start there. A heading cannot be operated, so a focus ring on it
// only looks like a bug (iOS Safari drew one after a tap).

const outlineOf = (element: HTMLElement | SVGElement) => getComputedStyle(element).outlineStyle

test('the page heading takes focus after navigation, without a ring', async ({ page }) => {
  await page.goto('/')
  const link = page.getByRole('link', { name: 'Transactions' })
  await link.focus()

  await page.keyboard.press('Enter')

  const heading = page.getByRole('heading', { level: 1, name: 'Transactions' })
  await expect(heading).toBeFocused()
  expect(await heading.evaluate(outlineOf)).toBe('none')
})

test('controls still show a focus ring from the keyboard (WCAG 2.4.7)', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible()

  // The first Tab stop is the skip link, except in WebKit, which by default
  // (like Safari) skips links and stops at the first form control.
  await page.keyboard.press('Tab')

  const focused = page.locator(':focus')
  await expect(focused).toHaveCount(1)
  expect(await focused.evaluate(outlineOf)).toBe('solid')
})
