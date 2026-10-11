import { expect, test } from './fixtures'

// #76: iOS Safari zooms the page into any focused form control whose text
// is under 16px, and often stays zoomed. The size that triggers it is the
// computed one, so checking it is a faithful test in every engine.

const PAGES = [
  // The custom range shows the period selector's date fields.
  '/?startDate=2024-08-01&endDate=2024-08-31',
  '/transactions',
]

for (const path of PAGES) {
  test(`form controls on ${path} are at least 16px, so iOS does not zoom`, async ({ page }) => {
    await page.goto(path)
    const controls = page.locator('main').locator('input:not([type=radio]), select, textarea')
    await expect(controls.first()).toBeVisible()

    const sizes = await controls.evaluateAll((elements) =>
      elements.map((element) => ({
        control: element.closest('label')?.firstElementChild?.textContent,
        size: Number.parseFloat(getComputedStyle(element).fontSize),
      })),
    )

    expect(sizes.length).toBeGreaterThan(0)
    expect(sizes.filter(({ size }) => size < 16)).toEqual([])
  })
}
