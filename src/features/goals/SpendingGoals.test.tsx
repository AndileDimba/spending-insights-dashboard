import { screen, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'

import { server } from '@/mocks/node'
import { goalsSchema, profileSchema } from '@/shared/api/schemas'
import { first, specExample } from '@/test/api-spec'
import { expectNoAccessibilityViolations } from '@/test/axe'
import { renderWithProviders } from '@/test/render'

import { SpendingGoals } from './SpendingGoals'

// Scenarios of #19, against the spec's goals example: Entertainment at
// R 650,30 of R 1 000,00 (on track) and Groceries at R 1 450,80 of
// R 1 500,00 (warning), both with 12 days left.

const GOALS_URL = '*/api/customers/12345/goals'
const goals = () => specExample(goalsSchema, 6)

function respondWith(body: object) {
  server.use(http.get(GOALS_URL, () => HttpResponse.json(body)))
}

beforeEach(() => {
  server.use(
    http.get('*/api/customers/12345/profile', () =>
      HttpResponse.json(specExample(profileSchema, 1)),
    ),
  )
})

function goalCard(category: string) {
  return screen.findByRole('listitem', { name: `${category} budget` })
}

describe('SpendingGoals', () => {
  it('shows the amounts, the days left and a progress bar for each goal', async () => {
    respondWith(goals())

    renderWithProviders(<SpendingGoals />)

    const entertainment = within(await goalCard('Entertainment'))
    expect(entertainment.getByText('R 650,30 of R 1 000,00')).toBeInTheDocument()
    expect(entertainment.getByText('65% used')).toBeInTheDocument()
    expect(entertainment.getByText('12 days left')).toBeInTheDocument()
    const bar = entertainment.getByRole('progressbar', { name: 'Entertainment budget used' })
    expect(bar).toHaveAttribute('value', '65.03')
    expect(bar).toHaveAttribute('max', '100')
  })

  it('shows each status as words, not only colour (A8)', async () => {
    respondWith(goals())

    renderWithProviders(<SpendingGoals />)

    expect(within(await goalCard('Entertainment')).getByText('On track')).toBeInTheDocument()
    expect(within(await goalCard('Groceries')).getByText('Close to limit')).toBeInTheDocument()
  })

  it('fills the bar when a budget is exceeded, and shows the real percentage', async () => {
    const payload = goals()
    Object.assign(first(payload.goals), {
      currentSpent: 1124,
      percentageUsed: 112.4,
      status: 'exceeded',
    })
    respondWith(payload)

    renderWithProviders(<SpendingGoals />)

    const entertainment = within(await goalCard('Entertainment'))
    expect(entertainment.getByText('Over budget')).toBeInTheDocument()
    expect(entertainment.getByText('112,4% used')).toBeInTheDocument()
    expect(entertainment.getByRole('progressbar')).toHaveAttribute('value', '100')
  })

  it('shows a neutral status for one the contract does not list (A8)', async () => {
    const payload = goals()
    first(payload.goals).status = 'paused'
    respondWith(payload)

    renderWithProviders(<SpendingGoals />)

    expect(
      within(await goalCard('Entertainment')).getByText('Status unavailable'),
    ).toBeInTheDocument()
  })

  it('says when there is one day left, not "1 days"', async () => {
    const payload = goals()
    first(payload.goals).daysRemaining = 1
    respondWith(payload)

    renderWithProviders(<SpendingGoals />)

    expect(within(await goalCard('Entertainment')).getByText('1 day left')).toBeInTheDocument()
  })

  it('shows an empty state when there are no goals', async () => {
    respondWith({ goals: [] })

    renderWithProviders(<SpendingGoals />)

    expect(await screen.findByText('You have no spending goals yet')).toBeInTheDocument()
  })

  it('marks the region as busy while the goals load', async () => {
    server.use(
      http.get(GOALS_URL, async () => {
        await delay(50)
        return HttpResponse.json(goals())
      }),
    )

    renderWithProviders(<SpendingGoals />)

    expect(screen.getByRole('region', { name: 'Budgets' })).toHaveAttribute('aria-busy', 'true')
    await goalCard('Entertainment')
    expect(screen.getByRole('region', { name: 'Budgets' })).toHaveAttribute('aria-busy', 'false')
  })

  it('requests the goals again when Retry is selected after an error', async () => {
    let attempts = 0
    server.use(
      http.get(GOALS_URL, () => {
        attempts += 1
        return attempts === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(goals())
      }),
    )
    const { user } = renderWithProviders(<SpendingGoals />)

    expect(await screen.findByRole('alert')).toHaveTextContent('We could not load your budgets')
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await goalCard('Entertainment')).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    respondWith(goals())

    const { container } = renderWithProviders(<SpendingGoals />)

    await goalCard('Entertainment')
    await expectNoAccessibilityViolations(container)
  })
})
