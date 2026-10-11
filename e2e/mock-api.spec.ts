import { expect, test } from './fixtures'

// #78: browsers stop idle service workers. A tester's iPhone did it while
// paging through transactions, and Chrome does it to a sleeping tab. After
// that, the demo's API calls reached the network and failed.

test('the demo keeps answering after the browser stops its service workers', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'Only Chromium lets a test stop service workers')
  const transactions = page.getByRole('region', { name: 'Transactions' })
  await page.goto('/transactions')
  await expect(transactions).toHaveAttribute('aria-busy', 'false')

  const devTools = await page.context().newCDPSession(page)
  await devTools.send('ServiceWorker.enable')
  await devTools.send('ServiceWorker.stopAllWorkers')
  await page.getByRole('button', { name: 'Next page' }).click()

  await expect(page).toHaveURL(/page=2/)
  await expect(transactions).toHaveAttribute('aria-busy', 'false')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(transactions.getByRole('row').nth(1)).toBeVisible()
})
