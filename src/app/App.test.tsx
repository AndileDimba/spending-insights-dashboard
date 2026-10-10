import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { createHandlers } from '@/mocks/handlers'
import { server } from '@/mocks/node'
import { expectNoAccessibilityViolations } from '@/test/axe'
import { renderRoutes } from '@/test/render'

import { AppLayout } from './layout/AppLayout'
import { routes } from './routes'

// Scenarios of #13. "No horizontal scrolling at 360px" needs a real layout
// engine, so it is covered by the Playwright tests in #23.

// Pages fetch their data, so every test here runs against the mock API.
beforeEach(() => {
  server.use(...createHandlers({ seed: 1, now: () => new Date('2024-09-16T12:00:00Z') }))
})

describe('skip link', () => {
  it('is the first thing Tab reaches, and moves focus to the main region', async () => {
    const { user } = renderRoutes(routes)

    await user.tab()

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
  })
})

describe.each([
  ['/', 'Overview'],
  ['/transactions', 'Transactions'],
  ['/no-such-page', 'Page not found'],
])('the page at %s', (route, heading) => {
  it('has header, navigation and main landmarks and exactly one h1', () => {
    renderRoutes(routes, { route })

    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderRoutes(routes, { route })

    await expectNoAccessibilityViolations(container)
  })
})

describe('navigation between pages', () => {
  it('sets the document title on the first page without moving focus', () => {
    renderRoutes(routes)

    expect(document.title).toBe('Overview | Spending Insights')
    expect(document.body).toHaveFocus()
  })

  it('changes the title and moves focus to the page heading', async () => {
    const { user } = renderRoutes(routes)

    await user.click(screen.getByRole('link', { name: 'Transactions' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Transactions' })).toHaveFocus()
    expect(document.title).toBe('Transactions | Spending Insights')
  })

  it('marks the link to the current page', () => {
    renderRoutes(routes, { route: '/transactions' })

    expect(screen.getByRole('link', { name: 'Transactions' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current')
  })
})

describe('unknown route', () => {
  it('shows a not found page with a link back to the dashboard', async () => {
    const { user } = renderRoutes(routes, { route: '/no-such-page' })

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Go to the overview' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument()
  })
})

describe('a crash in one view is contained', () => {
  let shouldThrow = true
  function FragileView() {
    if (shouldThrow) throw new Error('Render failed')
    return <h1>Recovered</h1>
  }

  it('shows a fallback with a retry, and the rest of the app keeps working', async () => {
    shouldThrow = true
    const { user } = renderRoutes([
      { element: <AppLayout />, children: [{ index: true, element: <FragileView /> }] },
    ])

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()

    shouldThrow = false
    await user.click(screen.getByRole('button', { name: 'Try again' }))

    expect(screen.getByRole('heading', { name: 'Recovered' })).toBeInTheDocument()
  })
})
