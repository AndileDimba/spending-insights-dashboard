import { act, screen, waitFor, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { PeriodSelector } from '@/features/period'
import { createHandlers } from '@/mocks/handlers'
import { server } from '@/mocks/node'
import { profileSchema, summarySchema } from '@/shared/api/schemas'
import { specExample } from '@/test/api-spec'
import { expectNoAccessibilityViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/render'

import { SpendingSummary } from './SpendingSummary'

// Scenarios of #16. The spec's summary example: R 4 250,75 over 47
// transactions, average R 90,44, Groceries on top, spending up 12.5% and
// transactions down 3.2%.

const SUMMARY_URL = '*/api/customers/12345/spending/summary'
const summary = () => specExample(summarySchema, 2)

let summaryRequests: URLSearchParams[] = []

function respondWith(body: object) {
  server.use(
    http.get(SUMMARY_URL, ({ request }) => {
      summaryRequests.push(new URL(request.url).searchParams)
      return HttpResponse.json(body)
    }),
  )
}

beforeEach(() => {
  summaryRequests = []
  server.use(
    http.get('*/api/customers/12345/profile', () =>
      HttpResponse.json(specExample(profileSchema, 1)),
    ),
  )
})

function card(name: string) {
  return screen.getByRole('group', { name })
}

describe('SpendingSummary', () => {
  it('shows total spent, number of purchases, average purchase and top category (A21)', async () => {
    respondWith(summary())

    renderWithProviders(<SpendingSummary />)

    await screen.findByRole('group', { name: 'Total spent' })
    expect(card('Total spent')).toHaveTextContent('R 4 250,75')
    expect(card('Purchases')).toHaveTextContent('47')
    expect(card('Average purchase')).toHaveTextContent('R 90,44')
    expect(card('Top category')).toHaveTextContent('Groceries')
  })

  it('says spending went up in words, not only with colour', async () => {
    respondWith(summary())

    renderWithProviders(<SpendingSummary />)

    expect(
      within(await screen.findByRole('group', { name: 'Total spent' })).getByText(
        '12,5% more than the previous period',
      ),
    ).toBeInTheDocument()
  })

  it('says the number of purchases went down', async () => {
    respondWith(summary())

    renderWithProviders(<SpendingSummary />)

    expect(
      within(await screen.findByRole('group', { name: 'Purchases' })).getByText(
        '3,2% fewer than the previous period',
      ),
    ).toBeInTheDocument()
  })

  it('says when nothing changed', async () => {
    respondWith({ ...summary(), comparedToPrevious: { spentChange: 0, transactionChange: 0 } })

    renderWithProviders(<SpendingSummary />)

    expect(await screen.findAllByText('No change from the previous period')).toHaveLength(2)
  })

  it('says when there is nothing to compare with (A11)', async () => {
    respondWith({
      ...summary(),
      comparedToPrevious: { spentChange: null, transactionChange: null },
    })

    renderWithProviders(<SpendingSummary />)

    expect(await screen.findAllByText('Nothing to compare with the previous period')).toHaveLength(
      2,
    )
  })

  it('shows an empty state for a period without spending (A12)', async () => {
    respondWith({
      ...summary(),
      totalSpent: 0,
      transactionCount: 0,
      averageTransaction: 0,
      topCategory: null,
    })

    renderWithProviders(<SpendingSummary />)

    expect(await screen.findByText('No spending in this period')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Total spent' })).not.toBeInTheDocument()
  })

  it('shows refunds as their own figure, not netted from spending (A21)', async () => {
    respondWith({ ...summary(), refunds: { totalAmount: 409.92, transactionCount: 2 } })

    renderWithProviders(<SpendingSummary />)

    const refunds = await screen.findByRole('group', { name: 'Refunds' })
    expect(refunds).toHaveTextContent('R 409,92')
    expect(refunds).toHaveTextContent('2 refunds')
    expect(card('Total spent')).toHaveTextContent('R 4 250,75')
  })

  it('names a single refund in the singular', async () => {
    respondWith({ ...summary(), refunds: { totalAmount: 50, transactionCount: 1 } })

    renderWithProviders(<SpendingSummary />)

    expect(await screen.findByRole('group', { name: 'Refunds' })).toHaveTextContent('1 refund')
  })

  it('leaves the refunds out when the API does not send them (A21)', async () => {
    respondWith(summary())

    renderWithProviders(<SpendingSummary />)

    await screen.findByRole('group', { name: 'Total spent' })
    expect(screen.queryByRole('group', { name: 'Refunds' })).not.toBeInTheDocument()
  })

  it('shows the refunds of a period with no purchases, not an empty state (A21)', async () => {
    respondWith({
      ...summary(),
      totalSpent: 0,
      transactionCount: 0,
      averageTransaction: 0,
      topCategory: null,
      refunds: { totalAmount: 50, transactionCount: 1 },
    })

    renderWithProviders(<SpendingSummary />)

    expect(await screen.findByRole('group', { name: 'Refunds' })).toHaveTextContent('R 50,00')
    expect(card('Total spent')).toHaveTextContent('R 0,00')
    expect(screen.queryByText('No spending in this period')).not.toBeInTheDocument()
  })

  it('shows an error, not a wrong figure, for a malformed refunds total', async () => {
    respondWith({ ...summary(), refunds: { totalAmount: -50, transactionCount: 1 } })

    renderWithProviders(<SpendingSummary />)

    expect(
      await screen.findByText('We could not load your spending summary', {}, { timeout: 5000 }),
    ).toBeInTheDocument()
  })

  it('names the period it covers', async () => {
    respondWith(summary())

    renderWithProviders(<SpendingSummary />, { route: '/?period=90d' })

    expect(
      await screen.findByRole('region', { name: 'Spending summary, last 90 days' }),
    ).toBeInTheDocument()
    expect(summaryRequests[0]?.get('period')).toBe('90d')
  })

  it('stays on the last 30 days for a custom range, and says so (A20)', async () => {
    respondWith(summary())

    renderWithProviders(<SpendingSummary />, {
      route: '/?startDate=2024-08-01&endDate=2024-08-31',
    })

    expect(
      await screen.findByText(
        'These totals are for the last 30 days. Your custom range applies to categories and transactions.',
      ),
    ).toBeInTheDocument()
    expect(summaryRequests[0]?.get('period')).toBe('30d')
  })

  it('marks the region as busy while the summary loads', async () => {
    server.use(
      http.get(SUMMARY_URL, async () => {
        await delay(50)
        return HttpResponse.json(summary())
      }),
    )

    renderWithProviders(<SpendingSummary />)

    expect(screen.getByRole('region', { name: /Spending summary/ })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await screen.findByRole('group', { name: 'Total spent' })
    expect(screen.getByRole('region', { name: /Spending summary/ })).toHaveAttribute(
      'aria-busy',
      'false',
    )
  })

  // #77: swapping the cards for skeletons shrank the page under the reader.
  it('keeps the current totals on screen while a new period loads', async () => {
    let answer: () => void = () => undefined
    const answered = new Promise<void>((resolve) => (answer = resolve))
    server.use(
      http.get(SUMMARY_URL, async ({ request }) => {
        if (new URL(request.url).searchParams.get('period') === '7d') {
          await answered
        }
        return HttpResponse.json(summary())
      }),
    )
    const { router } = renderWithProviders(<SpendingSummary />)
    await screen.findByRole('group', { name: 'Total spent' })

    await act(() => router.navigate('/?period=7d'))

    expect(card('Total spent')).toHaveTextContent('R 4 250,75')
    const region = screen.getByRole('region', { name: 'Spending summary, last 7 days' })
    expect(region).toHaveAttribute('aria-busy', 'true')
    answer()
    await waitFor(() => expect(region).toHaveAttribute('aria-busy', 'false'))
  })

  it('requests the summary again when Retry is selected after an error', async () => {
    let requests = 0
    server.use(
      http.get(SUMMARY_URL, () => {
        requests += 1
        return requests === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(summary())
      }),
    )
    const { user } = renderWithProviders(<SpendingSummary />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load your spending summary',
    )
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('group', { name: 'Total spent' })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    respondWith(summary())

    const { container } = renderWithProviders(<SpendingSummary />)

    await screen.findByRole('group', { name: 'Total spent' })
    await expectNoAccessibilityViolations(container)
  })
})

describe('SpendingSummary with the period selector', () => {
  it('updates for a newly selected period', async () => {
    server.use(...createHandlers({ seed: 1, now: () => new Date('2024-09-16T10:00:00Z') }))
    const { user } = renderWithProviders(
      <>
        <PeriodSelector />
        <SpendingSummary />
      </>,
    )
    await screen.findByRole('region', { name: 'Spending summary, last 30 days' })

    await user.click(screen.getByRole('radio', { name: 'Last 7 days' }))

    expect(
      await screen.findByRole('region', { name: 'Spending summary, last 7 days' }),
    ).toBeInTheDocument()
  })
})
