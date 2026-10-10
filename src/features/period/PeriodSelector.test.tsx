import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { createHandlers } from '@/mocks/handlers'
import { server } from '@/mocks/node'
import { useCategoryBreakdown } from '@/shared/api/queries'
import { expectNoAccessibilityViolations } from '@/test/axe'
import { fixClock } from '@/test/clock'
import { renderWithProviders } from '@/test/render'

import { PeriodSelector } from './PeriodSelector'
import { usePeriodSelection } from './usePeriodSelection'

// Scenarios of #15. "Today" is 16 September 2024 in South Africa.

const NOW = '2024-09-16T10:00:00Z'

beforeEach(() => {
  fixClock(NOW)
  server.use(...createHandlers({ seed: 1, now: () => new Date(NOW) }))
})

function query(router: { state: { location: { search: string } } }) {
  return new URLSearchParams(router.state.location.search)
}

describe('PeriodSelector', () => {
  it('selects the last 30 days when the URL has no period', async () => {
    renderWithProviders(<PeriodSelector />)

    expect(await screen.findByRole('radio', { name: 'Last 30 days' })).toBeChecked()
  })

  it('puts a chosen period in the URL, and the back button restores the previous one', async () => {
    const { user, router } = renderWithProviders(<PeriodSelector />)

    await user.click(await screen.findByRole('radio', { name: 'Last 90 days' }))

    expect(query(router).get('period')).toBe('90d')
    expect(screen.getByRole('radio', { name: 'Last 90 days' })).toBeChecked()

    await router.navigate(-1)

    expect(await screen.findByRole('radio', { name: 'Last 30 days' })).toBeChecked()
  })

  it('selects the period from a deep link', async () => {
    renderWithProviders(<PeriodSelector />, { route: '/?period=7d' })

    expect(await screen.findByRole('radio', { name: 'Last 7 days' })).toBeChecked()
  })

  it('falls back to the last 30 days for an invalid period, without an error (threat T4)', async () => {
    renderWithProviders(<PeriodSelector />, { route: '/?period=999d' })

    expect(await screen.findByRole('radio', { name: 'Last 30 days' })).toBeChecked()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('applies a custom date range to the URL', async () => {
    const { user, router } = renderWithProviders(<PeriodSelector />, { route: '/?period=7d' })

    await user.click(await screen.findByRole('radio', { name: 'Custom range' }))
    await user.type(screen.getByLabelText('From'), '2024-08-01')
    await user.type(screen.getByLabelText('To'), '2024-08-31')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(query(router).get('startDate')).toBe('2024-08-01')
    expect(query(router).get('endDate')).toBe('2024-08-31')
    expect(query(router).has('period')).toBe(false)
    expect(screen.getByRole('radio', { name: 'Custom range' })).toBeChecked()
  })

  it('shows the applied range from a deep link', async () => {
    renderWithProviders(<PeriodSelector />, { route: '/?startDate=2024-08-01&endDate=2024-08-31' })

    expect(await screen.findByRole('radio', { name: 'Custom range' })).toBeChecked()
    expect(screen.getByLabelText('From')).toHaveValue('2024-08-01')
    expect(screen.getByLabelText('To')).toHaveValue('2024-08-31')
  })

  it.each([
    [
      'the start is after the end',
      '2024-08-31',
      '2024-08-01',
      'The start date must be on or before the end date.',
    ],
    ['the end is in the future', '2024-09-01', '2024-09-17', 'The end date cannot be after today.'],
    ['a date is missing', '2024-09-01', '', 'Choose both a start and an end date.'],
  ])(
    'explains an invalid range, where %s, and does not apply it',
    async (_case, from, to, message) => {
      const { user, router } = renderWithProviders(<PeriodSelector />, { route: '/?period=7d' })

      await user.click(await screen.findByRole('radio', { name: 'Custom range' }))
      await user.type(screen.getByLabelText('From'), from)
      if (to) await user.type(screen.getByLabelText('To'), to)
      await user.click(screen.getByRole('button', { name: 'Apply' }))

      expect(screen.getByRole('alert')).toHaveTextContent(message)
      expect(query(router).get('period')).toBe('7d')
      expect(query(router).has('startDate')).toBe(false)
    },
  )

  it('changes the period with the arrow keys, and the group has an accessible name', async () => {
    const { user, router } = renderWithProviders(<PeriodSelector />)

    expect(screen.getByRole('radiogroup', { name: 'Period' })).toBeInTheDocument()
    await user.click(await screen.findByRole('radio', { name: 'Last 30 days' }))
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Last 90 days' })).toHaveFocus()
    expect(query(router).get('period')).toBe('90d')
  })

  it('offers the documented periods when the filters cannot be loaded', () => {
    server.use(
      http.get('*/api/customers/12345/filters', () => new HttpResponse(null, { status: 500 })),
    )

    renderWithProviders(<PeriodSelector />)

    expect(screen.getByRole('radio', { name: 'Last 7 days' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Last year' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('has no detectable accessibility violations, with the custom range open', async () => {
    const { container, user } = renderWithProviders(<PeriodSelector />)

    await user.click(await screen.findByRole('radio', { name: 'Custom range' }))

    await expectNoAccessibilityViolations(container)
  })
})

describe('usePeriodSelection', () => {
  function CategoryRange() {
    const { apiInput } = usePeriodSelection()
    const { data } = useCategoryBreakdown(apiInput)
    return data ? (
      <p>
        {data.dateRange.startDate} to {data.dateRange.endDate}
      </p>
    ) : null
  }

  it('gives the data hooks the custom range from the URL, so the data uses it', async () => {
    renderWithProviders(<CategoryRange />, { route: '/?startDate=2024-08-01&endDate=2024-08-31' })

    expect(await screen.findByText('2024-08-01 to 2024-08-31')).toBeInTheDocument()
  })

  it('gives the data hooks the chosen period', async () => {
    renderWithProviders(<CategoryRange />, { route: '/?period=7d' })

    expect(await screen.findByText('2024-09-10 to 2024-09-16')).toBeInTheDocument()
  })
})
