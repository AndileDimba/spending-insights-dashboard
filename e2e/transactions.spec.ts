import { expect, scrollsSideways, test } from './fixtures'

// #74: on an iPhone the date filters were wider than the screen, the page
// scrolled sideways, and the date fields were shorter than the selects.

const DATES = ['From', 'To']

test('the transaction filters fit the screen and line up', async ({ page }) => {
  await page.goto('/transactions?startDate=2022-10-11&endDate=2026-10-10')
  await expect(page.getByRole('region', { name: 'Transactions' })).toHaveAttribute(
    'aria-busy',
    'false',
  )

  expect(await scrollsSideways(page)).toBe(false)

  const width = page.viewportSize()?.width ?? 0
  const box = async (label: string) => {
    const field = DATES.includes(label)
      ? page.getByLabel(label, { exact: true })
      : page.getByRole('combobox', { name: label })
    const found = await field.boundingBox()
    if (!found) throw new Error(`No box for ${label}`)
    return found
  }
  for (const label of ['Category', 'From', 'To', 'Sort by']) {
    const { x, width: fieldWidth } = await box(label)
    expect(x, `${label} starts on screen`).toBeGreaterThanOrEqual(0)
    expect(x + fieldWidth, `${label} ends on screen`).toBeLessThanOrEqual(width)
  }
  // The date fields are as tall as the selects, so the rows line up.
  const selectHeight = (await box('Category')).height
  for (const label of DATES) {
    expect((await box(label)).height, `${label} height`).toBeCloseTo(selectHeight, 0)
  }
})
