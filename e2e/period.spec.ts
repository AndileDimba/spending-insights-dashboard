import { expect, test } from './fixtures'

// #95: on an iPhone the custom range's empty date fields collapsed to slivers.

test('the custom range date fields are wide enough for a date', async ({ page }) => {
  await page.goto('/')
  await page.locator('label', { hasText: /^Custom range$/ }).click()

  const width = page.viewportSize()?.width ?? 0
  for (const name of ['From', 'To']) {
    const box = await page.getByLabel(name, { exact: true }).boundingBox()
    if (!box) throw new Error(`No box for ${name}`)
    // 9rem holds a formatted date at 16px with room to spare.
    expect(box.width, `${name} width`).toBeGreaterThanOrEqual(144)
    expect(box.x + box.width, `${name} ends on screen`).toBeLessThanOrEqual(width)
  }
})
