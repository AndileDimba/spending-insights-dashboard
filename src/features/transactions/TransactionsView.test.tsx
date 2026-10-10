import { screen, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '@/mocks/node'
import { filtersSchema, profileSchema, transactionsSchema } from '@/shared/api/schemas'
import { first, specExample } from '@/test/api-spec'
import { expectNoAccessibilityViolations } from '@/test/axe'
import { stubMediaQueries } from '@/test/media'
import { renderWithProviders } from '@/test/render'

import { TransactionsView } from './TransactionsView'

// Scenarios of #20, against the spec's transactions example: Pick n Pay,
// R 245,80 on 2024-09-16T14:30:00Z by credit card, and Netflix, R 199,00 on
// 2024-09-15T10:15:00Z by debit order.

const TRANSACTIONS_URL = '*/api/customers/12345/transactions'
const transactions = () => specExample(transactionsSchema, 5)

function respondWith(body: object) {
  server.use(http.get(TRANSACTIONS_URL, () => HttpResponse.json(body)))
}

beforeEach(() => {
  server.use(
    http.get('*/api/customers/12345/profile', () =>
      HttpResponse.json(specExample(profileSchema, 1)),
    ),
    // The filters' category list comes from here.
    http.get('*/api/customers/12345/filters', () =>
      HttpResponse.json(specExample(filtersSchema, 7)),
    ),
  )
})

describe('TransactionsView on a wide screen', () => {
  beforeEach(() => {
    stubMediaQueries({ matches: true })
  })

  it('shows a table with a caption and the five columns', async () => {
    respondWith(transactions())

    renderWithProviders(<TransactionsView />)

    const table = await screen.findByRole('table', { name: 'Transactions' })
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent)
    expect(headers).toEqual(['Date', 'Merchant', 'Category', 'Payment method', 'Amount'])
    expect(within(table).getAllByRole('row')).toHaveLength(3)
  })

  it('shows dates in South African time and amounts in rand', async () => {
    respondWith(transactions())

    renderWithProviders(<TransactionsView />)

    const row = within(await screen.findByRole('row', { name: /Pick n Pay/ }))
    // 14:30 UTC is 16:30 in South Africa (NFR L2).
    expect(row.getByText('16 Sept 2024, 16:30')).toBeInTheDocument()
    expect(row.getByText('R 245,80')).toBeInTheDocument()
    expect(row.getByText('Groceries')).toBeInTheDocument()
    expect(row.getByText('Credit Card')).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    respondWith(transactions())

    const { container } = renderWithProviders(<TransactionsView />)

    await screen.findByRole('table')
    await expectNoAccessibilityViolations(container)
  })
})

describe('TransactionsView on a phone', () => {
  beforeEach(() => {
    stubMediaQueries({ matches: false })
  })

  it('shows a list instead of a table', async () => {
    respondWith(transactions())

    renderWithProviders(<TransactionsView />)

    const list = await screen.findByRole('list', { name: 'Transactions' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows the same details in each item', async () => {
    respondWith(transactions())

    renderWithProviders(<TransactionsView />)

    const item = within(await screen.findByRole('listitem', { name: /Netflix/ }))
    expect(item.getByText('R 199,00')).toBeInTheDocument()
    expect(item.getByText('15 Sept 2024, 12:15')).toBeInTheDocument()
    expect(item.getByText(/Entertainment/)).toBeInTheDocument()
    expect(item.getByText(/Debit Order/)).toBeInTheDocument()
  })

  it('renders a merchant name containing markup as plain text (threat T1)', async () => {
    const payload = transactions()
    first(payload.transactions).merchant = '<img src=x onerror=alert(1)>'
    respondWith(payload)

    renderWithProviders(<TransactionsView />)

    expect(await screen.findByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows a refund as money returned, in words as well as the sign (A7)', async () => {
    const payload = transactions()
    first(payload.transactions).amount = -245.8
    respondWith(payload)

    renderWithProviders(<TransactionsView />)

    const item = within(await screen.findByRole('listitem', { name: /Pick n Pay/ }))
    expect(item.getByText('+R 245,80')).toBeInTheDocument()
    expect(item.getByText('Refund')).toBeInTheDocument()
  })

  it('shows an empty state when no transactions match', async () => {
    respondWith({
      ...transactions(),
      transactions: [],
      pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
    })

    renderWithProviders(<TransactionsView />)

    expect(await screen.findByText('No transactions match these filters')).toBeInTheDocument()
  })

  it('marks the region as busy while the transactions load', async () => {
    server.use(
      http.get(TRANSACTIONS_URL, async () => {
        await delay(50)
        return HttpResponse.json(transactions())
      }),
    )

    renderWithProviders(<TransactionsView />)

    expect(screen.getByRole('region', { name: 'Transactions' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await screen.findByRole('list', { name: 'Transactions' })
    expect(screen.getByRole('region', { name: 'Transactions' })).toHaveAttribute(
      'aria-busy',
      'false',
    )
  })

  it('requests the transactions again when Retry is selected after an error', async () => {
    let attempts = 0
    server.use(
      http.get(TRANSACTIONS_URL, () => {
        attempts += 1
        return attempts === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(transactions())
      }),
    )
    const { user } = renderWithProviders(<TransactionsView />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load your transactions',
    )
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('list', { name: 'Transactions' })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    respondWith(transactions())

    const { container } = renderWithProviders(<TransactionsView />)

    await screen.findByRole('list', { name: 'Transactions' })
    await expectNoAccessibilityViolations(container)
  })
})
