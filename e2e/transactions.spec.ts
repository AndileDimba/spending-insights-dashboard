import { expect, expectNoAccessibilityViolations, scrollsSideways, test } from './fixtures'

// #23, journey "filter, sort, paginate, reload and share a deep link". The
// URL is the state (ADR 0007), so a reload or a shared link shows the same.
test('filters, sorting and paging live in a URL that can be reloaded and shared', async ({
  page,
  context,
}) => {
  const transactions = page.getByRole('region', { name: 'Transactions' })
  const category = page.getByRole('combobox', { name: 'Category' })
  const sortBy = page.getByRole('combobox', { name: 'Sort by' })
  const pages = page.getByRole('navigation', { name: 'Pages' })
  await page.goto('/transactions')
  await expect(transactions).toHaveAttribute('aria-busy', 'false')

  await category.selectOption('Groceries')
  await sortBy.selectOption({ label: 'Amount, highest first' })
  await page.getByRole('button', { name: 'Next page' }).click()

  await expect(page).toHaveURL(/category=Groceries/)
  await expect(page).toHaveURL(/sortBy=amount_desc/)
  await expect(page).toHaveURL(/page=2/)
  await expect(pages).toContainText(/Page 2 of \d+/)
  await expectNoAccessibilityViolations(page)

  await page.reload()
  await expect(category).toHaveValue('Groceries')
  await expect(sortBy).toHaveValue('amount_desc')
  await expect(pages).toContainText(/Page 2 of \d+/)

  // Someone opening the shared link sees the same view.
  const shared = await context.newPage()
  await shared.goto(page.url())
  await expect(shared.getByRole('combobox', { name: 'Category' })).toHaveValue('Groceries')
  await expect(shared.getByRole('navigation', { name: 'Pages' })).toContainText(/Page 2 of \d+/)
})

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
