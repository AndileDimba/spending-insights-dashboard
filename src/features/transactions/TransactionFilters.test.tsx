import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createHandlers } from '@/mocks/handlers'
import { server } from '@/mocks/node'
import { fixClock } from '@/test/clock'
import { stubMediaQueries } from '@/test/media'
import { renderWithProviders } from '@/test/render'

import { TransactionsView } from './TransactionsView'

// Scenarios of #21, against the mock API, which really filters and sorts.
// "Today" is 16 September 2024. The list layout is used throughout.

const NOW = '2024-09-16T10:00:00Z'
let requested: URLSearchParams[] = []

beforeEach(() => {
  fixClock(NOW)
  stubMediaQueries({ matches: false })
  requested = []
  server.use(...createHandlers({ seed: 1, now: () => new Date(NOW) }))
  server.events.removeAllListeners('request:start')
  server.events.on('request:start', ({ request }) => {
    const url = new URL(request.url)
    if (url.pathname.endsWith('/transactions')) requested.push(url.searchParams)
  })
})

function search(router: { state: { location: { search: string } } }) {
  return new URLSearchParams(router.state.location.search)
}

async function listedItems() {
  return within(await screen.findByRole('list', { name: 'Transactions' })).getAllByRole('listitem')
}

describe('TransactionsView filters', () => {
  it('filters by category, puts it in the URL and returns to the first page', async () => {
    const { user, router } = renderWithProviders(<TransactionsView />, {
      route: '/transactions?page=3',
    })
    await listedItems()

    await user.selectOptions(await screen.findByLabelText('Category'), 'Groceries')

    expect(search(router).get('category')).toBe('Groceries')
    expect(search(router).has('page')).toBe(false)
    await screen.findByRole('status')
    const items = await listedItems()
    expect(items.every((item) => item.textContent.includes('Groceries'))).toBe(true)
  })

  it('filters by a date range', async () => {
    const { user, router } = renderWithProviders(<TransactionsView />)
    await listedItems()

    await user.type(screen.getByLabelText('From'), '2024-09-01')
    await user.type(screen.getByLabelText('To'), '2024-09-07')

    expect(search(router).get('startDate')).toBe('2024-09-01')
    expect(search(router).get('endDate')).toBe('2024-09-07')
    await listedItems()
    const last = requested.at(-1)
    expect(last?.get('startDate')).toBe('2024-09-01')
    expect(last?.get('endDate')).toBe('2024-09-07')
  })

  it('sorts by amount, highest first', async () => {
    const { user, router } = renderWithProviders(<TransactionsView />)
    await listedItems()

    await user.selectOptions(screen.getByLabelText('Sort by'), 'Amount, highest first')

    expect(search(router).get('sortBy')).toBe('amount_desc')
    await screen.findByRole('status')
    expect(requested.at(-1)?.get('sortBy')).toBe('amount_desc')
  })

  it('restores every control from a deep link', async () => {
    renderWithProviders(<TransactionsView />, {
      route:
        '/transactions?category=Dining&startDate=2024-08-01&endDate=2024-08-31&sortBy=amount_asc',
    })

    await listedItems()
    expect(
      await screen.findByRole('option', { name: 'Dining', selected: true }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('From')).toHaveValue('2024-08-01')
    expect(screen.getByLabelText('To')).toHaveValue('2024-08-31')
    expect(screen.getByLabelText('Sort by')).toHaveValue('amount_asc')
  })

  it('uses safe defaults for an unknown category or sort order, without an error (A13, threat T4)', async () => {
    renderWithProviders(<TransactionsView />, {
      route: '/transactions?category=%3Cscript%3E&sortBy=merchant',
    })

    await listedItems()
    expect(screen.getByLabelText('Category')).toHaveValue('')
    expect(screen.getByLabelText('Sort by')).toHaveValue('date_desc')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(requested.every((params) => !params.has('category'))).toBe(true)
  })

  it('announces the number of results politely', async () => {
    const { user } = renderWithProviders(<TransactionsView />)
    await listedItems()

    await user.selectOptions(await screen.findByLabelText('Category'), 'Utilities')

    const status = await screen.findByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status.textContent).toMatch(/^\d+ transactions?$/)
  })

  it('clears every filter', async () => {
    const { user, router } = renderWithProviders(<TransactionsView />, {
      route:
        '/transactions?category=Dining&startDate=2024-08-01&endDate=2024-08-31&sortBy=amount_asc',
    })
    await listedItems()

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))

    expect(search(router).toString()).toBe('')
  })
})
