import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createHandlers, type MockApiOptions } from '@/mocks/handlers'
import { server } from '@/mocks/node'
import { expectNoAccessibilityViolations } from '@/test/axe'
import { fixClock } from '@/test/clock'
import { stubMediaQueries } from '@/test/media'
import { renderWithProviders } from '@/test/render'

import { TransactionsView } from './TransactionsView'

// Scenarios of #22, against the mock API: 1 221 transactions for seed 1 on
// 16 September 2024, so 62 pages of 20.

const NOW = '2024-09-16T10:00:00Z'
let requested: URLSearchParams[] = []

function useMockApi(options: MockApiOptions = {}) {
  server.use(...createHandlers({ seed: 1, now: () => new Date(NOW), ...options }))
}

beforeEach(() => {
  fixClock(NOW)
  stubMediaQueries({ matches: false })
  requested = []
  server.events.removeAllListeners('request:start')
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url)
    if (url.pathname.endsWith('/transactions')) requested.push(url.searchParams)
  })
})

function search(router: { state: { location: { search: string } } }) {
  return new URLSearchParams(router.state.location.search)
}

async function firstMerchant() {
  const list = await screen.findByRole('list', { name: 'Transactions' })
  return within(list).getAllByRole('listitem')[0]?.textContent
}

describe('TransactionsView paging', () => {
  it('goes to the next page, reflected in the URL and the request', async () => {
    useMockApi()
    const { user, router } = renderWithProviders(<TransactionsView />)
    await firstMerchant()

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    expect(search(router).get('page')).toBe('2')
    expect(await screen.findByText('Page 2 of 62')).toBeInTheDocument()
    expect(Object.fromEntries(requested.at(-1) ?? [])).toMatchObject({ limit: '20', offset: '20' })
  })

  it('goes back with Previous', async () => {
    useMockApi()
    const { user, router } = renderWithProviders(<TransactionsView />, { route: '/?page=3' })
    await screen.findByText('Page 3 of 62')

    await user.click(screen.getByRole('button', { name: 'Previous page' }))

    expect(search(router).get('page')).toBe('2')
  })

  it('disables Previous on the first page and Next on the last', async () => {
    useMockApi()
    renderWithProviders(<TransactionsView />)

    await screen.findByText('Page 1 of 62')
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled()
  })

  it('disables Next when there are no more transactions', async () => {
    useMockApi()
    renderWithProviders(<TransactionsView />, { route: '/?page=62' })

    await screen.findByText('Page 62 of 62')
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('changes the page size and returns to the first page', async () => {
    useMockApi()
    const { user, router } = renderWithProviders(<TransactionsView />, { route: '/?page=4' })
    await screen.findByText('Page 4 of 62')

    await user.selectOptions(screen.getByLabelText('Per page'), '50')

    expect(search(router).get('pageSize')).toBe('50')
    expect(search(router).has('page')).toBe(false)
    expect(await screen.findByText('Page 1 of 25')).toBeInTheDocument()
    expect(Object.fromEntries(requested.at(-1) ?? [])).toMatchObject({ limit: '50', offset: '0' })
  })

  it('offers the first page when the URL asks for one beyond the last', async () => {
    useMockApi()
    const { user, router } = renderWithProviders(<TransactionsView />, { route: '/?page=999' })

    expect(await screen.findByText('There is no page 999.')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Go to the first page' }))

    expect(search(router).has('page')).toBe(false)
    expect(await screen.findByText('Page 1 of 62')).toBeInTheDocument()
  })

  it('falls back to safe values for a page or page size that is not allowed (threat T4)', async () => {
    useMockApi()
    renderWithProviders(<TransactionsView />, { route: '/?page=abc&pageSize=1000' })

    expect(await screen.findByText('Page 1 of 62')).toBeInTheDocument()
    expect(Object.fromEntries(requested.at(-1) ?? [])).toMatchObject({ limit: '20', offset: '0' })
  })

  it('moves focus to the results heading and keeps the old page visible until the next arrives', async () => {
    useMockApi({ scenario: 'slow', slowDelayMs: 300 })
    const { user } = renderWithProviders(<TransactionsView />)
    const firstPageTop = await firstMerchant()

    await user.click(screen.getByRole('button', { name: 'Next page' }))

    expect(screen.getByRole('heading', { name: 'Results' })).toHaveFocus()
    // Still the first page while the second loads (NFR P7).
    expect(await firstMerchant()).toBe(firstPageTop)
    expect(await screen.findByText('Page 2 of 62', {}, { timeout: 3000 })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    useMockApi()
    const { container } = renderWithProviders(<TransactionsView />)

    await screen.findByText('Page 1 of 62')
    await expectNoAccessibilityViolations(container)
  })
})
