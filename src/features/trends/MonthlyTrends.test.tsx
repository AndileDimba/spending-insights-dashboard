import { screen, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { server } from '@/mocks/node'
import { profileSchema, trendsSchema } from '@/shared/api/schemas'
import { specExample } from '@/test/api-spec'
import { expectNoAccessibilityViolations } from '@/test/axe'
import { fixClock } from '@/test/clock'
import { renderWithProviders } from '@/test/render'

import { MonthlyTrends } from './MonthlyTrends'

// Scenarios of #18, against the spec's trends example: six months, January
// to June 2024, with June the highest at R 4 250,75. "Today" is 20 June 2024,
// so June is the current, incomplete month.

const TRENDS_URL = '*/api/customers/12345/spending/trends'
const trends = () => specExample(trendsSchema, 4)

let requests: URLSearchParams[] = []

// The chart is loaded lazily. Its first import in jsdom takes many seconds, so
// it is loaded once here rather than inside whichever test happens to run first.
beforeAll(async () => {
  await import('./TrendsChart')
}, 60_000)

function respondWith(body: object) {
  server.use(
    http.get(TRENDS_URL, ({ request }) => {
      requests.push(new URL(request.url).searchParams)
      return HttpResponse.json(body)
    }),
  )
}

beforeEach(() => {
  requests = []
  fixClock('2024-06-20T10:00:00Z')
  server.use(
    http.get('*/api/customers/12345/profile', () =>
      HttpResponse.json(specExample(profileSchema, 1)),
    ),
  )
})

const region = () => screen.findByRole('region', { name: 'Monthly spending' })

describe('MonthlyTrends', () => {
  it('requests 12 months when the URL does not say', async () => {
    respondWith(trends())

    renderWithProviders(<MonthlyTrends />)

    await screen.findByRole('img')
    expect(requests[0]?.get('months')).toBe('12')
    expect(screen.getByRole('radio', { name: '12 months' })).toBeChecked()
  })

  it('puts a chosen range in the URL and requests it', async () => {
    respondWith(trends())
    const { user, router } = renderWithProviders(<MonthlyTrends />)

    await user.click(await screen.findByRole('radio', { name: '6 months' }))

    expect(new URLSearchParams(router.state.location.search).get('months')).toBe('6')
    await screen.findByRole('img')
    expect(requests.at(-1)?.get('months')).toBe('6')
  })

  it('requests at most 24 months, whatever the URL says (A9)', async () => {
    respondWith(trends())

    renderWithProviders(<MonthlyTrends />, { route: '/?months=60' })

    await screen.findByRole('img')
    expect(requests[0]?.get('months')).toBe('24')
    expect(screen.getByRole('radio', { name: '24 months' })).toBeChecked()
  })

  it('says when fewer months came back than were asked for (A4)', async () => {
    respondWith(trends())

    renderWithProviders(<MonthlyTrends />)

    expect(await screen.findByText('Showing 6 of 12 months')).toBeInTheDocument()
  })

  it('summarises the chart in words', async () => {
    respondWith(trends())

    renderWithProviders(<MonthlyTrends />)

    const chart = await screen.findByRole('img')

    // en-ZA amounts use non-breaking spaces, so compare with spaces normalised.
    expect(chart.getAttribute('aria-label')?.replace(/\s/g, ' ')).toBe(
      'Chart of monthly spending from January 2024 to June 2024. The highest month is June 2024 at R 4 250,75. Show as table lists every month.',
    )
  })

  it('lists each month with total spent, transactions and average in a table', async () => {
    respondWith(trends())
    const { user } = renderWithProviders(<MonthlyTrends />)

    await user.click(await screen.findByText('Show as table'))

    const table = screen.getByRole('table', { name: 'Monthly spending' })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(7) // a header row and six months
    expect(within(table).getByRole('columnheader', { name: 'Total spent' })).toBeInTheDocument()
    expect(rows[1]).toHaveTextContent('January 2024')
    expect(rows[1]).toHaveTextContent('R 3 890,25')
    expect(rows[1]).toHaveTextContent('42')
    expect(rows[1]).toHaveTextContent('R 92,62')
  })

  it('labels the current month as incomplete, in the table and under the chart (A4)', async () => {
    respondWith(trends())
    const { user } = renderWithProviders(<MonthlyTrends />)

    // Its low bar is a month in progress, not a drop in spending.
    expect(await screen.findByText('June 2024 is the month so far.')).toBeInTheDocument()
    await user.click(screen.getByText('Show as table'))

    expect(screen.getByRole('rowheader', { name: 'June 2024 (so far)' })).toBeInTheDocument()
  })

  it('shows an empty state when there is no history', async () => {
    respondWith({ trends: [] })

    renderWithProviders(<MonthlyTrends />)

    expect(await screen.findByText('No spending history yet')).toBeInTheDocument()
  })

  it('marks the region as busy while the months load', async () => {
    server.use(
      http.get(TRENDS_URL, async () => {
        await delay(50)
        return HttpResponse.json(trends())
      }),
    )

    renderWithProviders(<MonthlyTrends />)

    expect(await region()).toHaveAttribute('aria-busy', 'true')
    await screen.findByRole('img')
    expect(await region()).toHaveAttribute('aria-busy', 'false')
  })

  it('requests the months again when Retry is selected after an error', async () => {
    let attempts = 0
    server.use(
      http.get(TRENDS_URL, () => {
        attempts += 1
        return attempts === 1
          ? new HttpResponse(null, { status: 500 })
          : HttpResponse.json(trends())
      }),
    )
    const { user } = renderWithProviders(<MonthlyTrends />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load your monthly spending',
    )
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('img')).toBeInTheDocument()
  })

  it('has no detectable accessibility violations, with the table open', async () => {
    respondWith(trends())
    const { container, user } = renderWithProviders(<MonthlyTrends />)

    await user.click(await screen.findByText('Show as table'))

    await expectNoAccessibilityViolations(container)
  })
})
